# i18nreplacer README

Made for nuxt 3 with i18n module.

Commands:
* cmd+shift+j: replace the text with i18n notation -> `text` -> `t('key', [variables])` 
* cmd+alt+shift+j replace the text with i18n notation in js   `` `text` `` -> `` `${t('key', [variables])}` ``
* cmd+shift+z merges a set of html keys into one -> `{{$t('key1')}} {{$t('key2')}}` -> `{{$t('key1')}}`
* cmd+alt+shift+z replace text with i18n notation in html -> `<div>text</div>` -> `<div>{{$t('key1')}}</abc>`
* cmd+shift+i update the key to match the current file -> in file pages/a/b.vue `t('pages_a_a_0')` -> `t('pages_a_b_0')`

All above commands are generating keys with pattern `folder1/folder2/file1.vue` -> `folder1_folder2_file1_{index}` where index is automatically increased to the next free index

For all above commands variables are automatically parsed and inserted
Changes are written to `i18n/lang/deMod.json` except the key update which is directly written to the source file `i18n/lang/de.json`
