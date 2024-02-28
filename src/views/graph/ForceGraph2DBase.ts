import { ForceGraphBase } from "./ForceGraphBase";
import Graph3dPlugin from "../../main";
import ForceGraph, { ForceGraphInstance } from "force-graph";
import Link from "../../graph/Link";
import Node from "../../graph/Node";
import { StateChange } from "../../util/State";
import { rgba } from "polished";
import * as d3 from "d3";

export class ForceGraph2DBase extends ForceGraphBase<ForceGraphInstance> {
	constructor(plugin: Graph3dPlugin, rootHtmlElement: HTMLElement, isLocalGraph: boolean) {
		super(plugin, rootHtmlElement, isLocalGraph);
	}

	protected createGraph() {
		console.log("ForceGraph2DBase createGraph");
		this.createInstance();
		this.createNodes();
		this.createLinks();
	}

	protected createInstance() {
		const [width, height] = [
			this.rootHtmlElement.innerWidth,
			this.rootHtmlElement.innerHeight,
		];
		console.log("ForceGraph2DBase createInstance", width, height);
		this.instance = ForceGraph()(this.rootHtmlElement)
			.graphData(this.getGraphData())
			.nodeLabel(
				(node: Node) => `<div class="node-label">${node.name}</div>`
			)
			.nodeRelSize(this.plugin.getSettings().display.nodeSize)
			.backgroundColor(rgba(0, 0, 0, 0.0))
			.width(width)
			.height(height)
			.d3Force("center", d3.forceRadial(-1))
			.d3Force("charge", d3.forceManyBody().strength(-50))
		console.log(this.instance.graphData().nodes);
	}

	protected onSettingsStateChanged = (data: StateChange) => {
		if (data.currentPath === "display.nodeSize") {
			this.instance.nodeRelSize(data.newValue);
		} else if (data.currentPath === "display.linkWidth") {
			this.instance.linkWidth(data.newValue);
		} else if (data.currentPath === "display.particleSize") {
			this.instance.linkDirectionalParticleWidth(
				this.plugin.getSettings().display.particleSize
			);
		}
	};

	protected override centerForce(strength: number): (alpha: number) => void {
		return (alpha) => {
			const nodes = this.instance.graphData().nodes;
			for (var i = 0, n = nodes.length; i < n; ++i) {
				var node = nodes[i]
				var dx = (node.x as number) - 0 || 1e-6
				var dy = (node.y as number) - 0 || 1e-6
				var r = Math.sqrt(dx * dx + dy * dy)
				var k = -strength * alpha * r;
				if (node.vx && node.vy) {
					node.vx += dx * k;
					node.vy += dy * k;
				}
			}
		}
	}

	protected createNodes() {
		this.instance
			.nodeColor((node: Node) => this.getNodeColor(node))
			.nodeVisibility(this.doShowNode)
			.onNodeHover(this.onNodeHover);
	};

	protected override createLinks() {
		console.log("gdkljhgklödsjgs")
		this.instance
			.linkWidth((link: Link) =>
				this.isHighlightedLink(link)
					? this.plugin.getSettings().display.linkThickness * 1.5
					: this.plugin.getSettings().display.linkThickness
			)
			.linkDirectionalParticles((link: Link) =>
				this.isHighlightedLink(link)
					? this.plugin.getSettings().display.particleCount
					: 0
			)
			.linkDirectionalParticleWidth(
				this.plugin.getSettings().display.particleSize
			)
			.linkVisibility(this.doShowLink)
			.onLinkHover(this.onLinkHover)
			.linkColor((link: Link) =>
				this.isHighlightedLink(link)
					? this.plugin.theme.textAccent
					: this.plugin.theme.textFaint
			);
	};

	protected override updateHighlight() {
		// trigger update of highlighted objects in scene
		this.instance
			.nodeColor(this.instance.nodeColor())
			.linkColor(this.instance.linkColor())
			.linkDirectionalParticles(this.instance.linkDirectionalParticles());
	}
}