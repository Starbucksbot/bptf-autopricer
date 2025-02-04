// Methods implementation without prices.tf dependency
var Methods = function() {};
var fs = require('fs');
const axios = require('axios');
const AsyncLock = require('async-lock');
const lock = new AsyncLock();

const config = require('./config.json');

// Helper methods from original implementation
Methods.prototype.halfScrapToRefined = function(halfscrap) {
    var refined = parseFloat((halfscrap / 18).toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]);
    return refined;
};

Methods.prototype.refinedToHalfScrap = function(refined) {
    var halfScrap = parseFloat((refined * 18).toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]);
    return halfScrap;
};

Methods.prototype.getRight = function(v) {
    var i = Math.floor(v),
        f = Math.round((v - i) / 0.11);
    return parseFloat((i + (f === 9 || f * 0.11)).toFixed(2));
};

Methods.prototype.parsePrice = function(original, keyPrice) {
    var metal = this.getRight(original.keys * keyPrice) + original.metal;
    return {
        keys: Math.trunc(metal / keyPrice),
        metal: this.getRight(metal % keyPrice)
    };
};

Methods.prototype.toMetal = function(obj, keyPriceInMetal) {
    var metal = 0;
    metal += obj.keys * keyPriceInMetal;
    metal += obj.metal;
    return this.getRight(metal);
};

Methods.prototype.validatePrice = function(buyPrice, sellPrice) {
    if (!buyPrice || !sellPrice) {
        throw new Error('Invalid price objects');
    }
    
    const buyValueInMetal = this.toMetal(buyPrice);
    const sellValueInMetal = this.toMetal(sellPrice);
    
    // Ensure sell price is higher than buy price
    if (buyValueInMetal >= sellValueInMetal) {
        throw new Error('Buy price must be lower than sell price');
    }
    
    return true;
};

Methods.prototype.waitXSeconds = async function(seconds) {
    return new Promise(resolve => {
        setTimeout(resolve, seconds * 1000);
    });
};

Methods.prototype.validateObject = function(obj) {
    if(!obj) {
        return false;
    }
    if(Object.keys(obj).length > 0) {
        if(obj.hasOwnProperty('keys') || obj.hasOwnProperty('metal')) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

Methods.prototype.createCurrencyObject = function(obj) {
    let newObj = {
        keys: 0,
        metal: 0
    };

    if (obj.hasOwnProperty('keys')) {
        newObj.keys = obj.keys;
    }

    if (obj.hasOwnProperty('metal')) {
        newObj.metal = obj.metal;
    }

    return newObj;
};

const comparePrices = (item1, item2) => {
    return item1.keys === item2.keys && item1.metal === item2.metal;
};

Methods.prototype.addToPricelist = function(item, PRICELIST_PATH) {
    try {
        lock.acquire('pricelist', () => {
            const data = fs.readFileSync(PRICELIST_PATH, 'utf8');
            let existingData = JSON.parse(data);
            let items = existingData.items;
            
            if (!Array.isArray(existingData.items)) {
                existingData.items = [];
            }

            const index = items.findIndex(i => i.sku === item.sku);
            
            if (index !== -1) {
                if (!comparePrices(items[index].buy, item.buy) || !comparePrices(items[index].sell, item.sell)) {
                    items[index] = item;
                    fs.writeFileSync(PRICELIST_PATH, JSON.stringify(existingData, null, 2));
                }
            } else {
                items.push(item);
                fs.writeFileSync(PRICELIST_PATH, JSON.stringify(existingData, null, 2));
            }
            return true;
        });
    } catch (error) {
        console.error('Error updating pricelist:', error);
        return false;
    }
};

module.exports = Methods;