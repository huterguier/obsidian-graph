export class ForceSettings {
    centerStrength = 0.0001;
    chargeStrength = -50;

    constructor(centerStrength?: number, chargeStrength?: number) {
        this.centerStrength = centerStrength ?? this.centerStrength;
        this.chargeStrength = chargeStrength ?? this.chargeStrength;
    }

    public static fromStore(store: any) {
        return new ForceSettings(store?.centerStrength, store?.chargeStrength);
    }

    public toObject() {
        return {
            centerStrength: this.centerStrength,
            chargeStrength: this.chargeStrength,
        };
    }
}
