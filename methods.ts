interface Attribute {
    defindex: number;
}

export class Methods {
    public isPainted(attributes: Attribute[], defindex: number): Promise<boolean> {
        return new Promise(resolve => {
            if (
                [
                    5052, 5027, 5031, 5032, 5040, 5033, 5076, 5029, 5077, 5034, 5038, 5051, 5039, 5035, 5037, 5054,
                    5030, 5055, 5056, 5036, 5053, 5028, 5063, 5046, 5062, 5064, 5065, 5061, 5060
                ].includes(defindex)
            ) {
                return resolve(false);
            }

            if (attributes) {
                for (const attribute of attributes) {
                    if (attribute.defindex == 142) return resolve(true);
                }
            }

            return resolve(false);
        });
    }

    public isSpelled(attributes: Attribute[]): boolean {
        if (attributes) {
            for (const attribute of attributes) {
                if (['1004', '1005', '1006', '1007', '1008', '1009'].includes(String(attribute.defindex))) {
                    return true;
                }
            }
        }
        return false;
    }
}