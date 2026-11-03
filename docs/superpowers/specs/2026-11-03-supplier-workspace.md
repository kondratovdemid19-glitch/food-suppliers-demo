# Supplier workspace for Goulash.Tech

The hiring brief asks for a useful food supplier search and comparison tool. Evaluation covers idea, workflow, usability, information completeness and practical usefulness. The AI Engineer role also values Python, SQL, API integration and shipping pilots.

Replace the oversized landing page with a procurement workspace: query and category filters above a compact catalog; shortlist alongside results; supplier details and comparison in dialogs. The distinctive element is an editable procurement request assembled from the shortlist, not a decorative AI chat. Use navy #192D35, teal #16736D, paper #F6F8F7, white #FFFFFF, text #172F35 and muted #607278. System humanist sans for content and tabular numerals for counts. No invented ratings or pricing. Category artwork uses simple food packaging line drawings, not fake company logos.

Six supplier records, each with dated official sources. Region means verified presence, never guaranteed delivery. Price and minimum unknowns stay explicit. Filters support ordinary product words and common city inflections. Selection, notes and contacted status persist locally; malformed storage and quota errors must not break the catalog. Comparison can span categories, with an explicit warning. Export produces a safe CSV; request draft can be edited, copied or downloaded without sending anything.

Python server loads the canonical JSON into SQLite and exposes validated read-only search and health endpoints. Client uses the API when configured and times out to the bundled catalog with an explicit source label. Never send notes or contact status to the server. The same static frontend remains available at the already submitted Pages URL. No paid LLM or externally supplied credentials; matching is source-based deterministic search, not an alleged AI recommendation.

Validate filter combinations, inflections, persistence, safe text/export, comparison and focus behavior; API invalid parameters and SQL-like input; desktop and phone visual workflows. Publish both code and the existing Pages URL; do not message Valeria.
