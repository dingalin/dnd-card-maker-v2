declare module 'dom-to-image-more' {
    interface Options {
        quality?: number;
        width?: number;
        height?: number;
        style?: Record<string, string>;
        filter?: (node: Node) => boolean;
        bgcolor?: string;
        cacheBust?: boolean;
    }

    function toPng(node: HTMLElement, options?: Options): Promise<string>;
    function toJpeg(node: HTMLElement, options?: Options): Promise<string>;
    function toBlob(node: HTMLElement, options?: Options): Promise<Blob>;
    function toSvg(node: HTMLElement, options?: Options): Promise<string>;
    function toPixelData(node: HTMLElement, options?: Options): Promise<Uint8ClampedArray>;

    export { toPng, toJpeg, toBlob, toSvg, toPixelData, Options };
    export default { toPng, toJpeg, toBlob, toSvg, toPixelData };
}
