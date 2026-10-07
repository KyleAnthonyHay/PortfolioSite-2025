# Portfolio agent knowledge base (draft)

One file per project, written for chunked embedding in Pinecone. The portfolio agent never sees code, so these files are its only source of project detail.

- Each `##` section is one chunk (roughly 150–400 words) and opens by naming the project, so it reads on its own when retrieved.
- The `<!-- meta: {...} -->` line under each heading is that chunk's Pinecone metadata (`type`, `project`, `category`, `technologies`).
- `<slug>.resources.json` lists links (website, GitHub, App Store) for `getProjectResource`. These are not embedded.
- `[NEEDS KYLE: ...]` marks facts only Kyle can supply. Remove each marker once answered.

The older `.txt` files one folder up are untouched and still feed the current site's RAG index (it reads only top-level `.txt` files).

## Open questions for Kyle

- Hardest part of each project, in your own words. It is marked in the Challenges section of SelahNote, Creator Dashboard, OnTract, Sentio+, V1 ProdBot, SoundSnag, YarnScript and Country Viewer.
