import ForceGraph3D, { ForceGraph3DInstance } from "3d-force-graph";
import ForceGraph, { ForceGraphInstance } from "force-graph";
import Node from "../../graph/Node";
import Link from "../../graph/Link";
import { StateChange } from "../../util/State";
import Graph3dPlugin from "../../main";
import Graph from "../../graph/Graph";
import { NodeGroup } from "../../settings/categories/GroupSettings";
import { rgba } from "polished";
import EventBus from "../../util/EventBus";

// Adapted from https://github.com/vasturiano/3d-force-graph/blob/master/example/highlight/index.html
// D3.js 3D Force Graph

export abstract class ForceGraphBase<T extends ForceGraph3DInstance | ForceGraphInstance>{
	protected instance: T;
	protected readonly rootHtmlElement: HTMLElement;

	protected readonly highlightedNodes: Set<string> = new Set();
	protected readonly highlightedLinks: Set<Link> = new Set();
	hoveredNode: Node | null;

	protected readonly isLocalGraph: boolean;
	protected graph: Graph;
	protected readonly plugin: Graph3dPlugin;

	constructor(
		plugin: Graph3dPlugin,
		rootHtmlElement: HTMLElement,
		isLocalGraph: boolean
	) {
		this.rootHtmlElement = rootHtmlElement;
		this.isLocalGraph = isLocalGraph;
		this.plugin = plugin;

		console.log("ForceGraph constructor", rootHtmlElement);

		this.createGraph();
		this.initListeners();
	}

	protected initListeners() {
		this.plugin.settingsState.onChange(this.onSettingsStateChanged);
		if (this.isLocalGraph)
			this.plugin.openFileState.onChange(this.refreshGraphData);
		EventBus.on("graph-changed", this.refreshGraphData);
	}

	protected abstract createGraph(): void;

	protected abstract createInstance(): void;

	protected getGraphData = (): Graph => {
		if (this.isLocalGraph && this.plugin.openFileState.value) {
			this.graph = this.plugin.globalGraph
				.clone()
				.getLocalGraph(this.plugin.openFileState.value);
			console.log(this.graph);
		} else {
			this.graph = this.plugin.globalGraph.clone();
		}

		return this.graph;
	};

	protected refreshGraphData = () => {
		this.instance.graphData(this.getGraphData());
	};

	protected abstract centerForce(strength : number): (alpha: number) => void;

	protected onSettingsStateChanged = (data: StateChange) => {
		console.log("onSettingsStateChanged", data)
		if (data.currentPath === "display.nodeSize") {
			this.instance.nodeRelSize(data.newValue);
		} else if (data.currentPath === "display.linkThickness") {
			console.log("linkWidth", data.newValue);
			this.instance.linkWidth(data.newValue);
		} else if (data.currentPath === "display.particleSize") {
			this.instance.linkDirectionalParticleWidth(
				this.plugin.getSettings().display.particleSize
			);
		} else if (data.currentPath === "force.centerStrength") {
			console.log("backgroundColor", data.newValue);
			this.instance.d3Force("center", this.centerForce(data.newValue));
			this.instance.d3ReheatSimulation();
		}
		// only refresh if 3d graph
		if (this.instance instanceof ForceGraph3D){
			const fg = this.instance as ForceGraph3DInstance;
			fg.refresh(); // other settings only need a refresh
		}
	};

	public updateDimensions() {
		const [width, height] = [
			this.rootHtmlElement.offsetWidth,
			this.rootHtmlElement.offsetHeight,
		];
		this.setDimensions(width, height);
	}

	public setDimensions(width: number, height: number) {
		this.instance.width(width);
		this.instance.height(height);
	}

    protected abstract createNodes(): void;

	protected getNodeColor = (node: Node): string => {
		if (this.isHighlightedNode(node)) {
			// Node is highlighted
			return node === this.hoveredNode
				? this.plugin.theme.interactiveAccentHover
				: this.plugin.theme.textAccent;
		} else {
			let color = this.plugin.theme.textMuted;
			this.plugin.getSettings().groups.groups.forEach((group) => {
				// multiple groups -> last match wins
				if (NodeGroup.matches(group.query, node)) color = group.color;
			});
			return color;
		}
	};

	protected doShowNode = (node: Node) => {
		return (
			(this.plugin.getSettings().filters.doShowOrphans ||
			node.links.length > 0) &&
			(this.plugin.getSettings().filters.doShowAttachments ||
			!node.isAttachment)
		);
	};

	protected doShowLink = (link: Link) => {
		return this.plugin.getSettings().filters.doShowAttachments || !link.linksAnAttachment
	}

	protected onNodeHover = (node: Node | null) => {
		if (
			(!node && !this.highlightedNodes.size) ||
			(node && this.hoveredNode === node)
		)
			return;

		this.clearHighlights();

		if (node) {
			this.highlightedNodes.add(node.id);
			node.neighbors.forEach((neighbor) =>
				this.highlightedNodes.add(neighbor.id)
			);
			const nodeLinks = this.graph.getLinksWithNode(node.id);

			if (nodeLinks)
				nodeLinks.forEach((link) => this.highlightedLinks.add(link));
		}
		this.hoveredNode = node ?? null;
		this.updateHighlight();
	};

	protected isHighlightedLink = (link: Link): boolean => {
		return this.highlightedLinks.has(link);
	};

	protected isHighlightedNode = (node: Node): boolean => {
		return this.highlightedNodes.has(node.id);
	};

	protected abstract createLinks(): void;

	protected onLinkHover = (link: Link | null) => {
		this.clearHighlights();

		if (link) {
			this.highlightedLinks.add(link);
			this.highlightedNodes.add(link.source);
			this.highlightedNodes.add(link.target);
		}
		this.updateHighlight();
	};

	protected clearHighlights = () => {
		this.highlightedNodes.clear();
		this.highlightedLinks.clear();
	};

	protected abstract updateHighlight(): void;

	getInstance(): T {
		return this.instance;
	}
}
