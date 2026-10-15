# Contributing

This host publishes **ISO's lists as ISO released them**. So most of what is wrong in a list is ISO's to fix, not ours: tell ISO
(the [external code sets page](https://www.iso20022.org/catalogue-messages/additional-content-messages/external-code-sets)); the next nightly run picks the correction up.

What belongs here:

- **A bug**: a path that answers wrongly, or a code set that differs from ISO's file. Use the **Bug** form.
- **A change to what is served or how it is built**: the **Enhancement** form first, then a pull request. Changes to the addresses and the resources only **add**,
  because clients in the field depend on them (see README.md).
- **Reviewing the nightly pull request**: read what changed, merge it if it looks like ISO's release. That is a contribution too.

Pull requests link an issue (`Closes #123`); the nightly pull request from ISO's file takes the `no-issue` label. Run `npm test` first (Node 24).
Do not edit `source/` by hand: it is what ISO published. A company's own codes go in a fork (README.md, *Run it, or host your own*).
