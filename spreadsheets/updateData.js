
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFilePath = path.join(__dirname, './data.json');

/**
 * Updates a value in the data.json file at the specified path.
 * @param {string[]} keyPath - Array of keys representing the path to the value (e.g., ['invoice', 'month-total'])
 * @param {*} newValue - The new value to set
 */
export function updateJsonValue(keyPath, newValue) {
	if (!Array.isArray(keyPath) || keyPath.length === 0) {
		throw new Error('keyPath must be a non-empty array');
	}
	let data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
	let obj = data;
	for (let i = 0; i < keyPath.length - 1; i++) {
		if (!(keyPath[i] in obj)) {
			throw new Error(`Key '${keyPath[i]}' not found in data.json`);
		}
		obj = obj[keyPath[i]];
	}
	obj[keyPath[keyPath.length - 1]] = newValue;
	fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 4), 'utf8');
}

// Example usage:
// updateJsonValue(['invoice', 'month-total'], 42);
