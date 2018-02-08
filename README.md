# rangee
Serialize/deserialize [Range](https://developer.mozilla.org/en-US/docs/Web/API/Range) in HTML.

Cares about serialization/deserialization only.

Highlighting of text is a matter of your implementation.
***
## Typical use case
1. User wants to highlight text in HTML.
2. User wants to see the highlighted text in HTML on next page load (application should store Range representation and apply after page load).
***
## Demo
Comming soon.
***
## Under the hood
### From Range object to Range string representation
1. Create array of atomic range objects only with text inside from input range.
2. Create HTML selector from array of atomic ranges as JSON.
3. Serialization.
4. Compression.
5. Encoding.
### From Range string representation to Range object
1. Decoding.
2. Decompression.
3. Deserialization.
4. JSON parse.
5. Array of Range DOM.
***
## Example (store and highlight)
```javascript
import Rangee from './Rangee';

const rangee = new Rangee({ document });

let rangeStorage = "";

document.querySelector("#save").addEventListener("click", () => {
    const selection = document.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        if (range) {
            const rangeRepresentation = rangee.serializeAtomic(range);
            rangeStorage = rangeRepresentation;
            // there you have rangee output (range representation in base64) and you can store somewhere
        }
    }    
})
...
document.querySelector("#load").addEventListener("click", () => {
    const rangeRepresentation = rangeStorage; // earlier stored range representation
    const ranges = rangee.deserilaizeAtomic(rangeRepresentation);

    // highlight range (sub ranges - beacause of HTML structure)
    ranges.forEach(range => {
        const highlight = document.createElement("mark")
        range.surroundContents(highlight);
    })   
})

```
## Supported browsers
<table class="rich-diff-level-zero"> <thead class="rich-diff-level-one"> <tr> <th>
<a href="http://godban.github.io/browsers-support-badges/" rel="nofollow"><img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="IE / Edge" width="24px" height="24px" style="max-width:100%;"></a><br>IE11 / Edge</th> <th>
<a href="http://godban.github.io/browsers-support-badges/" rel="nofollow"><img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" style="max-width:100%;"></a><br>Firefox</th> <th>
<a href="http://godban.github.io/browsers-support-badges/" rel="nofollow"><img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" style="max-width:100%;"></a><br>Chrome</th> <th>
<a href="http://godban.github.io/browsers-support-badges/" rel="nofollow"><img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" style="max-width:100%;"></a><br>Safari</th> <th>
<a href="http://godban.github.io/browsers-support-badges/" rel="nofollow"><img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/opera/opera_48x48.png" alt="Opera" width="24px" height="24px" style="max-width:100%;"></a><br>Opera</th> </tr> </thead> 
</table>

## Roadmap
- [x] Basic functionality
- [x] Implement deflate compression
- [x] Prepare to npm
- [x] Create table of supported browsers
- [ ] Your idea?
