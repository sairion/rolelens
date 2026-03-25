# Privacy Policy for RoleLens

Effective date: 2026-03-25

This Privacy Policy explains how the RoleLens Chrome extension handles information.

## Summary

RoleLens does not sell user data, does not use advertising trackers, and does not transmit your extension data to the developer's servers.

RoleLens is designed to work locally in your browser on `https://www.wanted.co.kr/*`.

## Information RoleLens Handles

RoleLens handles the following information:

- Company names shown on Wanted job cards that the extension reads from the page in order to apply your filtering or classification rules.
- Your extension settings, including:
  - Company-specific statuses you save (`+`, `-`, or `x`)
  - Your default status for companies that are not yet configured

RoleLens does not collect account passwords, payment information, government identifiers, health information, precise location, or browsing history outside the pages where the extension runs.

## How RoleLens Uses Information

RoleLens uses information only to provide the extension's core functionality:

- Read company names from Wanted job listing pages
- Apply your saved local filtering and classification rules to those pages
- Store your preferences so they remain available across browser sessions

## Data Storage

RoleLens stores your settings locally using Chrome's extension storage (`chrome.storage.local`).

Stored data remains in your browser profile unless you remove it, reset the extension data, or uninstall the extension.

## Data Sharing

RoleLens does not share your data with the developer, with third parties, or with advertisers.

RoleLens does not send your saved settings or extracted company names to any remote server operated by the developer.

## Remote Code and Network Activity

RoleLens does not load remote code.

The extension runs packaged code included in the extension bundle. It operates on `https://www.wanted.co.kr/*` pages so it can read company names from job cards and apply your locally saved settings.

## Permissions

RoleLens uses the following Chrome extension capabilities:

- `storage`: to save your settings locally on your device
- Access to `https://www.wanted.co.kr/*` through content script match patterns: to run on Wanted pages and apply the extension's functionality there

## Your Choices

You can control your data by:

- Editing or deleting saved company rules from the extension options page
- Removing the extension from Chrome, which stops any future access
- Clearing the extension's stored data from Chrome

## Data Retention

Your settings are retained until you delete them, clear extension storage, or uninstall the extension.

## Changes to This Policy

This Privacy Policy may be updated if the extension's data practices change. Any update will be reflected by revising this file and its effective date.

## Contact

For questions about this Privacy Policy or the extension, please use the project repository:

- Repository: [https://github.com/sairion/rolelens](https://github.com/sairion/rolelens)
- Issues: [https://github.com/sairion/rolelens/issues](https://github.com/sairion/rolelens/issues)
