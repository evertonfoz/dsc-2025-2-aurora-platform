"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToLower = ToLower;
function ToLower() {
    return (params) => {
        if (typeof params.value === 'string')
            return params.value.toLowerCase();
        return params.value;
    };
}
//# sourceMappingURL=to-lowercase.transform.js.map