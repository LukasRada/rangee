# Rangee

**Rangee** is a lightweight JavaScript library designed to serialize and deserialize the [Range](https://developer.mozilla.org/en-US/docs/Web/API/Range) object in HTML. This enables the storage and retrieval of text selections across page loads.

While Rangee focuses solely on serialization and deserialization, it leaves the text highlighting logic to your implementation, offering flexibility in how you manage text selections.

[![codecov](https://codecov.io/gh/LukasRada/rangee/branch/master/graph/badge.svg?token=3R33NFKKID)](https://codecov.io/gh/LukasRada/rangee)

---

## Table of Contents

-   [Features](#features)
-   [Use Cases](#use-cases)
-   [Installation](#installation)
-   [Usage](#usage)
    -   [Basic Example](#basic-example)
-   [How It Works](#how-it-works)
    -   [Serialization Process](#serialization-process)
    -   [Deserialization Process](#deserialization-process)
-   [Development](#development)
    -   [Running Unit Tests](#running-unit-tests)
    -   [Running E2E Tests](#running-e2e-tests)
-   [Example (Next.js App)](#example-nextjs-app)
-   [Supported Browsers](#supported-browsers)
-   [Roadmap](#roadmap)
-   [Contributing](#contributing)
-   [License](#license)

---

## Features

-   **Serialization**: Convert HTML Range objects into compact string representations.
-   **Deserialization**: Reconstruct HTML Range objects from serialized strings.
-   **Compression**: Efficiently compress serialized data for storage.
-   **Cross-Browser Support**: Compatible with modern browsers and IE11/Edge.

---

## Use Cases

### Highlighting Text in HTML

Store the user's text selection across sessions and reloads by serializing the Range object. Upon the next page load, the stored range can be deserialized and used to reapply the highlights.

### Persistent Text Selections

Ideal for applications where users interact with content, like reading apps or educational tools, where it's essential to remember text selections or highlights.

---

## Installation

Install Rangee using Yarn or npm:

```bash
yarn add rangee
```

or

```bash
npm install rangee
```

---

## Usage

### Basic Example

Here's a simple example of how to use Rangee to serialize and deserialize a text selection:

```javascript
import Rangee from 'rangee';

const rangee = new Rangee({ document });

let rangeStorage = '';

document.querySelector('#save').addEventListener('click', () => {
    const selection = document.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        if (range) {
            const rangeRepresentation = rangee.serializeAtomic(range);
            rangeStorage = rangeRepresentation;
            // Store rangeRepresentation for future use
        }
    }
});

document.querySelector('#load').addEventListener('click', () => {
    const rangeRepresentation = rangeStorage; // Retrieve stored range representation
    const ranges = rangee.deserializeAtomic(rangeRepresentation);

    // Highlight the deserialized ranges
    ranges.forEach(range => {
        const highlight = document.createElement('mark');
        range.surroundContents(highlight);
    });
});
```

---

## How It Works

### Serialization Process

1. **Range Object to Atomic Ranges**: Break down the input Range into atomic ranges, focusing on text nodes only.
2. **Create HTML Selector**: Convert the array of atomic ranges into a JSON representation.
3. **Serialization**: Serialize the JSON into a string format.
4. **Compression**: Apply deflate compression to reduce the data size.
5. **Encoding**: Encode the compressed data into a base64 string for easy storage.

### Deserialization Process

1. **Decoding**: Convert the base64 string back to compressed data.
2. **Decompression**: Decompress the data to retrieve the serialized string.
3. **Deserialization**: Convert the string back to a JSON object.
4. **JSON Parsing**: Parse the JSON to reconstruct the array of atomic ranges.
5. **Rebuild Range Objects**: Use the atomic ranges to create a DOM Range object.

---

## Development

### Running Unit Tests

To run the unit tests:

```bash
yarn test:unit
```

### Running E2E Tests

To run the end-to-end tests:

```bash
yarn test:e2e
```

---

## Example (Next.js App)

To see Rangee in action within a Next.js app:

```bash
cd examples/nextjs
yarn
yarn dev
```

---

## Supported Browsers

Rangee supports the following browsers:

<table class="rich-diff-level-zero"> 
<thead class="rich-diff-level-one"> 
<tr> 
<th><a href="http://godban.github.io/browsers-support-badges/" rel="nofollow"><img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="IE / Edge" width="24px" height="24px" style="max-width:100%;"></a><br>IE11 / Edge</th> 
<th><a href="http://godban.github.io/browsers-support-badges/" rel="nofollow"><img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" style="max-width:100%;"></a><br>Firefox</th> 
<th><a href="http://godban.github.io/browsers-support-badges/" rel="nofollow"><img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" style="max-width:100%;"></a><br>Chrome</th> 
<th><a href="http://godban.github.io/browsers-support-badges/" rel="nofollow"><img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" style="max-width:100%;"></a><br>Safari</th> 
<th><a href="http://godban.github.io/browsers-support-badges/" rel="nofollow"><img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/opera/opera_48x48.png" alt="Opera" width="24px" height="24px" style="max-width:100%;"></a><br>Opera</th> 
</tr> 
</thead> 
</table>

---

## Roadmap

-   [x] Basic functionality
-   [x] Implement deflate compression
-   [x] Prepare for npm release
-   [x] Create a table of supported browsers
-   [ ] Support for additional serialization formats (e.g., binary) for even smaller data sizes
-   [ ] **Your idea?** Contributions and suggestions are welcome!

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request with your ideas and improvements.

---

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.
