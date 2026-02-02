# AppForge Licensing Options

Primary license: Apache License 2.0 (root LICENSE) for broad adoption with patent protection.

Alternate licenses (see LICENSES/):
- MIT.txt — permissive, attribution required, no patent grant.
- Apache-2.0.txt — permissive with express patent grant and contribution terms.
- GPL-3.0.txt — copyleft; derivatives must remain GPLv3 when distributed.
- PROPRIETARY.txt — closed-source/internal use; all rights reserved.

Usage guidance:
- Default: Apache-2.0 for open distribution with patent clarity.
- Maximal openness: MIT for widest reuse without copyleft.
- Copyleft: GPL-3.0 if you require downstream modifications to stay open.
- Commercial/closed: PROPRIETARY for enterprise licensing.

How to apply:
1) Keep root LICENSE (Apache-2.0) as the primary. 
2) Point package.json "license" to "Apache-2.0".
3) For alternative offerings, include the relevant LICENSES/*.txt with your distribution and update documentation accordingly.

Notes:
- If you ship dual-licensed builds, clearly state which license governs each artifact.
- Keep NOTICE/attribution files from third-party dependencies as required by their licenses.
