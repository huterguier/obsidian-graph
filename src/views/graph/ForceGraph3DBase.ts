import { ForceGraphBase } from "./ForceGraphBase";
import ForceGraph3D, { ForceGraph3DInstance } from "3d-force-graph";
import Graph3dPlugin from "../../main";
import { StateChange } from "src/util/State";
import Link from "src/graph/Link";
import Node from "src/graph/Node";
import { rgba } from "polished";
import * as d3 from "d3";

export class ForceGraph3DBase extends ForceGraphBase<ForceGraph3DInstance> {
    constructor(plugin: Graph3dPlugin, rootHtmlElement: HTMLElement, isLocalGraph: boolean) {
        super(plugin, rootHtmlElement, isLocalGraph);
    }

    protected createInstance() {
		const [width, height] = [
			this.rootHtmlElement.innerWidth,
			this.rootHtmlElement.innerHeight,
		];
		this.instance = ForceGraph3D()(this.rootHtmlElement)
			.graphData(this.getGraphData())
			.nodeLabel(
				(node: Node) => `<div class="node-label">${node.name}</div>`
			)
			.nodeRelSize(this.plugin.getSettings().display.nodeSize)
			.backgroundColor(rgba(0, 0, 0, 0.0))
			.width(width)
			.height(height)
			.numDimensions(3)
			.d3Force("center", (alpha) => {
				const nodes = this.instance.graphData().nodes;
				for (var i = 0, n = nodes.length; i < n; ++i) {
					var node = nodes[i]
					var dx = (node.x as number) - 0 || 1e-6 
					var dy = (node.y as number) - 0 || 1e-6 
					var dz = (node.z as number) - 0 || 1e-6
					var r = Math.sqrt(dx * dx + dy * dy + dz * dz)
					var k = (200.0 - r) * 1.0 * alpha / r;
					if (node.vx && node.vy && node.vz) {
						node.vx += dx * k;
						node.vy += dy * k;
						node.vz += dz * k;
					}
			  	}
			});
		console.log(this.instance.d3Force("center"));
		
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

		this.instance.refresh(); // other settings only need a refresh
	};

    protected createNodes = () => {
		this.instance
			.nodeColor((node: Node) => this.getNodeColor(node))
			.nodeVisibility(this.doShowNode)
			.onNodeHover(this.onNodeHover);
	};

    protected createLinks = () => {
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
					: this.plugin.theme.textMuted
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