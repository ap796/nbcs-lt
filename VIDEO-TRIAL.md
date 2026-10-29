# Background video versions

Current selection: user-supplied 7141174-uhd_3840_2160_24fps.mp4 (Dell server footage).
Web copy: public/assets/dell-server-background.mp4; H.264 1920×1080 at 24 fps, no audio, fast-start MP4. Still fallback: dell-server-poster.jpg.
The existing video playback, pause, loop and reduced-motion behavior is retained.

Earlier versions are retained untouched:
- background-trial.mp4 / background-trial-poster.jpg: first uploaded networking video. Previous commit: 67a8c73776fae0b76e0e9cb141e5d4d34610e3de.
- server-room.mp4 / server-room-poster.jpg: original website video. Original commit: ef4e8296e4ddefb0143be9ff4035058c226f83f7.

To revert, restore the desired filenames in public/index.html and public/assets/css/site.css and regenerate SHA256SUMS.txt in a new commit. Do not reset shared history.
