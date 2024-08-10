export interface SerializationStrategy {
    serialize(ranges: Range[], relativeTo: HTMLElement): string;
    deserialize(result: string, document: Document): Range[];
}
