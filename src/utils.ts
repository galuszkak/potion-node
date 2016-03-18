
// Snake case to camel case
export function toCamelCase(string) {
	return string.replace(/_([a-z0-9])/g, (g) => g[1].toUpperCase());
}

export function tupleToObject(tuple: any[]) {
	let obj = {};
	for (let [key, value] of tuple) {
		console.log(key, value);
		obj[key] = value;
	}
	return obj;
}
