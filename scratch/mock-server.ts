
export class SenderError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SenderError";
    }
}
