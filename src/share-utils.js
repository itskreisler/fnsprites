export function compressCollection(baseList, activeObtained, activeMastered) {
    let bitString = '';
    baseList.forEach(sprite => {
        bitString += activeObtained.includes(sprite.id) ? '1' : '0';
    });
    baseList.forEach(sprite => {
        bitString += activeMastered.includes(sprite.id) ? '1' : '0';
    });

    while (bitString.length % 8 !== 0) bitString += '0';

    let byteArray = [];
    for (let i = 0; i < bitString.length; i += 8) {
        byteArray.push(parseInt(bitString.substring(i, i + 8), 2));
    }

    let binaryString = String.fromCharCode.apply(null, byteArray);
    return btoa(binaryString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decompressCollection(baseList, compressedString) {
    if (!compressedString) return { obtained: [], mastered: [] };
    try {
        let base64 = compressedString.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';
        let binaryString = atob(base64);

        let bitString = '';
        for (let i = 0; i < binaryString.length; i++) {
            let bits = binaryString.charCodeAt(i).toString(2);
            bitString += bits.padStart(8, '0');
        }

        let obtainedIds = [];
        let masteredIds = [];
        const totalSprites = baseList.length;

        baseList.forEach((sprite, index) => {
            if (bitString[index] === '1') {
                obtainedIds.push(sprite.id);
            }
            if (bitString[index + totalSprites] === '1') {
                masteredIds.push(sprite.id);
            }
        });
        return { obtained: obtainedIds, mastered: masteredIds };
    } catch (e) {
        console.error("Failed to decode collection sequence string", e);
        return { obtained: [], mastered: [] };
    }
}
