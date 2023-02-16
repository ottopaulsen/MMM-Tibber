Changes worth noticing, per version, starting from version 2.1.0

### 3.0.1

- This is an attempt to restart the live data subscription when no data has been received for 10 minutes, hoping to fix the freeze problem.

### 3.0.0

- Use new Tibber API for live data.
- Breaking change: You now must configure homeId instead of homeNumber. Go to https://developer.tibber.com/ to find your homeId.

### 2.1.2

- Bugfix swedish translations

### 2.1.1

- Update dependencies

### 2.1.0

- Make it possible to configure Tibber query interval, and set default to 5 minutes (was 1 minute before).
- Add changelog
