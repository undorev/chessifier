## 🌎 Contributing Translations

Help us make Chessifier accessible to everyone by contributing a new translation or improving an existing one\! Your contributions are valuable and easy to make.

### How to Contribute

All translation files are located in the `src/translation/` directory.

#### To Add a New Language

1.  **Create the new file**: Copy an existing translation file, such as `en_US.ts`, and rename it using your language's code (e.g., `am_AM.ts` for Armenian).
2.  **Translate the text**: Open your new file and translate all the text values within it.
3.  **Add the language to the settings**: Open [SettingsPage](src/features/settings/SettingsPage.tsx) and add a new language object to the settings menu.

For example:
<!-- end list -->

```typescript
    {
        value: "am_AM",
        label: "Armenian"
    }
```

#### To Update an Existing Translation

1.  **Edit the file**: Find the translation file for the language you want to update in `src/translation/`.
2.  **Make your changes**: Edit the necessary keys and update their values as needed.

### Verifying and Finalizing Your Changes

1.  **Run the update script**: After making your changes, run the following command to automatically check for and add any missing translation keys with placeholder values.

    ```sh
    pnpm scripts/update-missing-translations.ts
    ```

2.  **Update the README**: Use this script to ensure the `README` is up to date with the latest translation information.

    ```sh
    pnpm scripts/readme-updater.ts
    ```

3.  **Test your changes**: Start the development server to see your translations in action and make sure everything looks correct.

    ```sh
    pnpm dev
    ```

4.  **Submit a Pull Request**: Once you've confirmed your changes are working, commit your updates, push your branch, and open a new pull request.