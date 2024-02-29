import { ForceGraphBase } from "./ForceGraphBase";
import ForceGraph3D, { ForceGraph3DInstance } from "3d-force-graph";
import Graph3dPlugin from "../../main";
import { StateChange } from "src/util/State";
import Link from "src/graph/Link";
import Node from "src/graph/Node";
import { rgba } from "polished";
import * as d3 from "d3";
import SpriteText from "three-spritetext";

export class ForceGraph3DBase extends ForceGraphBase<ForceGraph3DInstance> {
    constructor(plugin: Graph3dPlugin, rootHtmlElement: HTMLElement, isLocalGraph: boolean) {
        super(plugin, rootHtmlElement, isLocalGraph);
    }

	protected createGraph() {
		this.createInstance();
		this.createNodes();
		this.createLinks();
	}

    protected override createInstance() {
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
			.d3Force("center", this.centerForce(0.0001));
		console.log(this.plugin.getSettings().force.centerStrength)
		
	}

	protected override centerForce(strength: number): (alpha: number) => void {
		return (alpha) => {
			const nodes = this.instance.graphData().nodes;
			for (var i = 0, n = nodes.length; i < n; ++i) {
				var node = nodes[i]
				var dx = (node.x as number) - 0 || 1e-6 
				var dy = (node.y as number) - 0 || 1e-6 
				var dz = (node.z as number) - 0 || 1e-6
				var r = Math.sqrt(dx * dx + dy * dy + dz * dz)
				var k = -strength * alpha * r;
				if (node.vx && node.vy && node.vz) {
					node.vx += dx * k;
					node.vy += dy * k;
					node.vz += dz * k;
				}
			}
		}
	}


    protected override onSettingsStateChanged = (data: StateChange) => {
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

protected override createNodes() {
	this.instance
		.nodeColor((node: Node) => this.getNodeColor(node))
		.nodeVisibility(this.doShowNode)
		.onNodeHover(this.onNodeHover)
		.nodeThreeObjectExtend(true)
		.nodeThreeObject((node : any) => {
			const sprite = new SpriteText(node.name);
			node.sprite = sprite;
			sprite.color = "white";
			sprite.textHeight = 8;
			sprite.backgroundColor = "black";
			// get current viewpoint of camera
			const currentCamera = this.instance.camera();
			const currentCameraPosition = currentCamera.position;
			// get the distance from the camera to the node
			const distance = Math.sqrt(
				Math.pow(node.x - currentCameraPosition.x, 2) +
				Math.pow(node.y - currentCameraPosition.y, 2) +
				Math.pow(node.z - currentCameraPosition.z, 2)
			);
			// always set position of sprite to be below the node relative to the camera



			return sprite;
		})
		// execture whenever camera stops moving
		.onEngineTick(() => {
			console.log("onEngineStop", this.instance.cameraPosition());
			
		})
};

    protected override createLinks() {
		console.log("ForceGraph3DBase createLinks");
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