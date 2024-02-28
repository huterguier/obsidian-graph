import { ItemView, WorkspaceLeaf } from "obsidian";
import Node from "../../graph/Node";
import { ForceGraph3DBase } from "./ForceGraph3DBase";
import { ForceGraph2DBase } from "./ForceGraph2DBase";
import { ForceGraphBase } from "./ForceGraphBase";
import { GraphSettingsView } from "../settings/GraphSettingsView";
import Graph3dPlugin from "src/main";
import { ForceGraph3DInstance } from "3d-force-graph";
import { ButtonComponent } from "obsidian";

export class GraphView extends ItemView {
	private forceGraph: ForceGraphBase<any>;
	private readonly isLocalGraph: boolean;
	private readonly plugin: Graph3dPlugin;
	private is3dGraph: boolean;

	constructor(
		plugin: Graph3dPlugin,
		leaf: WorkspaceLeaf,
		isLocalGraph = false
	) {
		super(leaf);
		this.isLocalGraph = isLocalGraph;
		this.plugin = plugin;
		this.is3dGraph = false;

		const viewContent = this.containerEl.querySelector(
			".view-content"
		) as HTMLElement;
		const otherSettings = new ButtonComponent(viewContent)
			.setIcon("rotate-3d")
			.setTooltip("Switch to 3d")
			.onClick(this.switchGraph);
		// place at bottom left corner
		otherSettings.buttonEl.style.position = "absolute";
		otherSettings.buttonEl.style.bottom = "0";
		otherSettings.buttonEl.style.left = "0";
		otherSettings.buttonEl.style.marginLeft = "10px";
		otherSettings.buttonEl.style.marginBottom = "10px";
		console.log("added button")
	}

	onunload() {
		super.onunload();
		this.forceGraph?.getInstance()._destructor();
	}

	showGraph() {
		const viewContent = this.containerEl.querySelector(
			".view-content"
		) as HTMLElement;

		if (viewContent) {
			viewContent.classList.add("graph-3d-view");
			this.appendGraph(viewContent);
			const settings = new GraphSettingsView(
				this.plugin.settingsState,
				this.plugin.theme,
				this.switchGraph.bind(this)
			);
			viewContent.appendChild(settings);
		} else {
			console.error("Could not find view content");
		}
	}

	getDisplayText(): string {
		return "3D-Graph";
	}

	getViewType(): string {
		return "3d_graph_view";
	}

	onResize() {
		super.onResize();
		this.forceGraph.updateDimensions();
	}

	switchGraph(mouseEvent: MouseEvent) {
		console.log("switching graph");
		this.forceGraph.getInstance()._destructor();
		const viewContent = this.containerEl.querySelector(
			".view-content"
		) as HTMLElement;
		this.is3dGraph = !this.is3dGraph;
		viewContent.innerHTML = "";
		this.showGraph();
	}

	private appendGraph(viewContent: HTMLElement) {
		if (this.is3dGraph) {
			this.forceGraph = new ForceGraph3DBase(
				this.plugin,
				viewContent,
				this.isLocalGraph
			);
		}
		else {
			this.forceGraph = new ForceGraph2DBase(
				this.plugin,
				viewContent,
				this.isLocalGraph
				);
		}

		this.forceGraph
			.getInstance()
			.onNodeClick((node: Node, mouseEvent: MouseEvent) => {
				const clickedNodeFile = this.app.vault
					.getFiles()
					.find((f) => f.path === node.path);

				if (clickedNodeFile) {
					if (this.isLocalGraph) {
						this.app.workspace
							.getLeaf(false)
							.openFile(clickedNodeFile);
					} else {
						this.leaf.openFile(clickedNodeFile);
					}
				}
			});
	}
}
