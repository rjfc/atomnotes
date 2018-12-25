# atomnotes
A note system that allows for both audio and text summarization.<br>
**A valid Google Cloud Platform must be set up and configured in order for the audio notes to work.**


If you get the following error:
```
atomnotes\node_modules\natural\lib\natural\brill_pos_tagger\lib\Brill_POS_Tag
ger.js:26

logger.setLevel('WARN');
       ^

TypeError: logger.setLevel is not a function
```
Comment out `logger.setLevel('WARN')` in `node_modules\natural\lib\natural\brill_pos_tagger\lib\Brill_POS_Tagger.js`.
