
export function flatten(object, separator = ".", ignore) {
    return Object.assign({}, ...function _flatten(child, path = []) {
        if (undefined === child || null === child) return [];
        return [].concat(...Object.keys(child).map(key => {
            if (ignore === key) { return ({ [path.concat([key]).join(separator)]: child[key] }); }
            return typeof child[key] === "object"
                ? _flatten(child[key], path.concat([key]))
                : ({ [path.concat([key]).join(separator)]: child[key] });
        }));
    }(object));
}