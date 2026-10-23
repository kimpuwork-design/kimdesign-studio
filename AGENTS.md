# Project rules

- Global portal shortcuts use the shared keyboard guard to avoid interrupting editable fields, composition, or handled events.
- Activity heatmap cells use design-system buttons and tooltips with a persistent selected-day readout so keyboard and touch users can inspect the same data as pointer users.
- Portal live search uses the unified projects table and a cancellable hook; obsolete searches must not restore results after clearing or closing the palette.
- Public admin shortcuts reuse the portal palette, while portal layouts own their instance to prevent duplicate dialogs and keyboard handlers.