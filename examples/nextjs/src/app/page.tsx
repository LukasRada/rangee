"use client";
import { Rangee } from "rangee"

export default function Home() {
  const handleClick = () => {  
    const selection = document.getSelection()
    if (!selection) {
        return;
    }
    const rangee = new Rangee({ document });
    rangee.onCompression((range) => { console.log("Compressed range", range) });
    rangee.onSerialization((range) => { console.log("Serialized range", range) });
    const range = selection.getRangeAt(0);
    const rangeSerialized = rangee.serializeAtomic(range);

    selection.removeAllRanges();

    const deserializedRanges = rangee.deserializeAtomic(rangeSerialized);
    deserializedRanges.forEach(range => {
        const highlight = document.createElement("mark")
        range.surroundContents(highlight);
    })
   };
  return (
    <div>
        <button onClick={handleClick}>Highlight text</button>
        <hr />
        <header>
            <h1>Complex HTML Page</h1>
            <p>Header section with some text.</p>
        </header>

            <ul>
                <li><a href="#section1">Section 1</a></li>
                <li><a href="#section2">Section 2</a></li>
                <li><a href="#section3">Section 3</a></li>
            </ul>

        <main>
            <section id="section1">
                <h2>Section 1</h2>
                <p>This is a paragraph in section 1. <strong>Strong text</strong> and <em>emphasized text</em>.</p>
                <article>
                    <h3>Article 1</h3>
                    <p>Article content with <a href="#">a link</a> and some inline elements like
                        <code>&lt;code&gt;</code>.
                    </p>
                    <pre>
                    {` function example() {
                        console.log("This is a code block.");
                    }`}
                </pre>
                </article>
                <aside>
                    <h3>Aside Section</h3>
                    <p>This is an aside, often used for side notes.</p>
                </aside>
            </section>

            <section id="section2">
                <h2>Section 2</h2>
                <p>Another section with a <abbr title="HyperText Markup Language">HTML</abbr> element and some
                    <mark>highlighted text</mark>.
                </p>
                <table>
                    <caption>Sample Table</caption>
                    <thead>
                        <tr>
                            <th>Header 1</th>
                            <th>Header 2</th>
                            <th>Header 3</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Row 1, Cell 1</td>
                            <td>Row 1, Cell 2</td>
                            <td>Row 1, Cell 3</td>
                        </tr>
                        <tr>
                            <td>Row 2, Cell 1</td>
                            <td>Row 2, Cell 2</td>
                            <td>Row 2, Cell 3</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td>Footer 1</td>
                            <td>Footer 2</td>
                            <td>Footer 3</td>
                        </tr>
                    </tfoot>
                </table>
            </section>

            <section id="section3">
                <h2>Section 3</h2>
                <p>This section contains a list, form, and media elements.</p>
                <ul>
                    <li>Unordered list item 1</li>
                    <li>Unordered list item 2</li>
                    <li>Unordered list item 3</li>
                </ul>
                <ol>
                    <li>Ordered list item 1</li>
                    <li>Ordered list item 2</li>
                    <li>Ordered list item 3</li>
                </ol>

                <form>
                    <label htmlFor="name">Name:</label>
                    <input type="text" id="name" name="name"/><br/>
                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" name="email"/><br/>
                    <label htmlFor="birthdate">Birthdate:</label>
                    <input type="date" id="birthdate" name="birthdate"/><br/>
                    <fieldset>
                        <legend>Preferences</legend>
                        <label htmlFor="subscribe">Subscribe to newsletter:</label>
                        <input type="checkbox" id="subscribe" name="subscribe" /><br />
                        <label htmlFor="gender">Gender:</label>
                        <select id="gender" name="gender">
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </fieldset>
                    <input type="submit" value="Submit" />
                </form>

                <figure>
                    <img src="https://via.placeholder.com/150" alt="Placeholder Image"/>
                    <figcaption>Figure caption for the image.</figcaption>
                </figure>

                <video controls>
                    <source src="movie.mp4" type="video/mp4"/>
                    Your browser does not support the video tag.
                </video>

                <audio controls>
                    <source src="audio.mp3" type="audio/mpeg"/>
                    Your browser does not support the audio element.
                </audio>
            </section>
        </main>

        <footer>
            <p>Footer section with contact information.</p>
            <address>
                Contact us at: <a href="mailto:info@example.com">info@example.com</a>
            </address>
        </footer>
    </div>
  );
}
