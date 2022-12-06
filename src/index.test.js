import { describe, it, expect } from 'vitest'
import rdfkv, { add } from '$lib/index.js'

const createFormData = (obj) => {
	const formData = new FormData();
	for (const [key, value] of Object.entries(obj)) {
	  formData.append(key, value);
	}
	return formData
}

describe('sum test', () => {
	it('adds 1 + 2 to equal 3', () => {
		expect(add(1, 2)).toBe(3);
	});
});



describe('Convert Simple Form to RDF Triples', () => {
	// <form method="POST" action="http://example.com/my/resource">
	//   <input type="text" name="http://purl.org/dc/terms/title"/>
	//   <button>Set the Title</button>
	// </form>
	// will produce:
	// <http://example.com/my/resource> dct:title "Whatever you wrote" .
	it('With default literal values', () => {
		let formData = createFormData({
		  "dct:title": "Whatever you wrote"
		})

		expect(rdfkv('http://example.com/my/resource', formData))
			.toMatchObject({
				delete: '',
				insert: '<http://example.com/my/resource> dct:title "Whatever you wrote" . '
			});
	});

	// For the sake of completeness, although it likely won’t come
	// up often in practice, the character to disambiguate plain
	// literals is the apostrophe '
	it('With explicit literal values', () => {
		let formData = createFormData({
		  "dct:title '": "Whatever you wrote"
		})

		expect(rdfkv('http://example.com/my/resource', formData))
			.toMatchObject({
				delete: '',
				insert: '<http://example.com/my/resource> dct:title "Whatever you wrote" . '
			});
	});


	// refernce a node:
	// <input name="http://www.w3.org/1999/02/22-rdf-syntax-ns#type :"/>
	it('References a node', () => {
		let formData = createFormData({
		  "rdf:type :": 'http://example.com/my/type'
		})

		expect(rdfkv('http://example.com/my/resource', formData))
			.toMatchObject({
				delete: '',
				insert: '<http://example.com/my/resource> rdf:type <http://example.com/my/type> . '
			});
	})

	// Lang tags!
	it('Can define languages', () => {
		let formData = createFormData({
			"dct:description @en": "A literal value in English."
		})
		expect(rdfkv('http://example.com/my/resource', formData))
			.toMatchObject({
				delete: '',
				insert: '<http://example.com/my/resource> dct:description "A literal value in English."@en . '
			});
	})

	// Types!
	it('Can define data types', () => {
		let formData = createFormData({
			"dct:created ^xsd:date": "2022-12-01"
		})
		expect(rdfkv('http://example.com/my/resource', formData))
			.toMatchObject({
				delete: '',
				insert: '<http://example.com/my/resource> dct:created "2022-12-01"^^xsd:date . '
			});
	})

	// ALl together now!
	it('Can do all of those all at once!', () => {
		let formData = createFormData({
			"dct:title": "Whatever you wrote",
			"dct:description @en": "A literal value in English.",
			"dct:created ^xsd:date": "2022-12-01",
		  "rdf:type :": 'http://example.com/my/type'
		})

		expect(rdfkv('http://example.com/my/resource', formData))
			.toMatchObject({
				delete: '',
				insert: '<http://example.com/my/resource> dct:title "Whatever you wrote" . <http://example.com/my/resource> dct:description "A literal value in English."@en . <http://example.com/my/resource> dct:created "2022-12-01"^^xsd:date . <http://example.com/my/resource> rdf:type <http://example.com/my/type> . '
			});
	})
});


// reference a blank node:
// <input name="http://www.w3.org/1999/02/22-rdf-syntax-ns#type _"/>

// subjects
// <form method="POST" action="http://example.com/my/resource">
//   <input type="text" name="http://example.com/other/resource
//                            http://purl.org/dc/terms/title"/>
//   <button>Set the Title</button>
// </form>

// graphs
// <input name="http://purl.org/dc/terms/title ' http://example.com/my/graph"/>
// This would be a rare instance in which you would encounter the need for the '
// designator, which you can naturally omit if you also specify a subject:
// <input name="http://example.com/other/resource
//              http://purl.org/dc/terms/title
//              http://example.com/my/graph"/>

// Statement Reversal
// <input name="! http://purl.org/dc/terms/creator"/>

// Add/Subtract

// The default behaviour is to merge relevant resources with the contents
// of the form, but if you want to delete statements, prepend with a -. +
// is a no-op for the default behaviour.
// <input name="- dct:title"/>

// Also consider = for "nuke all subject-predicate pairs of this kind and
// replace them with this value"
// <input name="= dct:title"/>

// Control Words
// TKTK

// Macro Expansions
// TKTK