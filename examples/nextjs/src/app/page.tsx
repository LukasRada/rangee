'use client';

import { Rangee, PakoCompressionStrategy, ByteSerializationStrategy } from 'rangee';
import Image from 'next/image';

export default function Home() {
    const handleClick = () => {
        const selection = document.getSelection();
        if (!selection) {
            return;
        }
        const rangee = new Rangee({
            document,
            compressionsStrategy: new PakoCompressionStrategy(),
            serializeStrategy: new ByteSerializationStrategy(),
        });
        rangee.onCompression(range => {
            console.log('Compressed range', range);
        });
        rangee.onSerialization(range => {
            console.log('Serialized range', range);
        });
        const range = selection.getRangeAt(0);
        const rangeSerialized = rangee.serializeAtomic(range);
        console.log('Range:', rangeSerialized);

        selection.removeAllRanges();

        const deserializedRanges = rangee.deserializeAtomic(rangeSerialized);
        deserializedRanges.forEach(range => {
            const highlight = document.createElement('mark');
            range.surroundContents(highlight);
        });
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
                <li>
                    <a href="#section1">Section 1</a>
                </li>
                <li>
                    <a href="#section2">Section 2</a>
                </li>
                <li>
                    <a href="#section3">Section 3</a>
                </li>
            </ul>

            <main>
                <section id="section1">
                    <h2>Section 1</h2>
                    <p>
                        This is a paragraph in section 1. <strong>Strong text</strong> and <em>emphasized text</em>.
                    </p>
                    <article>
                        <h3>Article 1</h3>
                        <p>
                            Article content with <a href="#">a link</a> and some inline elements like
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
                    <p>
                        Another section with a <abbr title="HyperText Markup Language">HTML</abbr> element and some
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
                        <input type="text" id="name" name="name" />
                        <br />
                        <label htmlFor="email">Email:</label>
                        <input type="email" id="email" name="email" />
                        <br />
                        <label htmlFor="birthdate">Birthdate:</label>
                        <input type="date" id="birthdate" name="birthdate" />
                        <br />
                        <fieldset>
                            <legend>Preferences</legend>
                            <label htmlFor="subscribe">Subscribe to newsletter:</label>
                            <input type="checkbox" id="subscribe" name="subscribe" />
                            <br />
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
                        <Image src="data:image/png;base64,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" width={150} height={150} alt="Placeholder Image" />
                        <figcaption>Figure caption for the image.</figcaption>
                    </figure>

                    <video controls>
                        <source src="movie.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>

                    <audio controls>
                        <source src="audio.mp3" type="audio/mpeg" />
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
