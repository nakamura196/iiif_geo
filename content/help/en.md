<b>Registration Screen</b>

Please prepare json data similar to what you get by pressing the 'Example' button, enter the URL of the respective file, and press the add button.

<b>View Screen</b>

The contemporary map is displayed on the left side of the screen, and the image on the right. By clicking on the markers on the contemporary map and the annotations on the image, the positions of the image and the contemporary map will be synchronized. You can zoom in with the + button and zoom out with the - button for both. For the image, pressing the home button will return the image to its initial position.

Contemporary Map

You can switch layers.
The selected marker is displayed in red.
Image

Click the annotation button to toggle the display of annotations on and off.
Clicking the rotation reset button will reset the rotation of the image.
You can rotate the image by changing the angle.
Clicking the 'Search' button in the header section allows you to search for annotations. By clicking the focus button on each search result, the positions of the image and the contemporary map can be synchronized.

## URL Parameters

This application supports the following URL parameters:

### Basic Parameters

- **`u`** - URL of the IIIF Manifest or data file (required)
  - Example: `?u=https://example.com/manifest.json`

### Display Control Parameters

- **`x`** - Map center longitude
- **`y`** - Map center latitude
- **`z`** - Map zoom level (0-20)
- **`id`** - ID of the feature to initially select
- **`rotation`** - Image rotation angle (in degrees)
- **`autoRotate`** - Enable/disable auto-rotation (true/false)

### Usage Example

```
https://example.com/?u=https://data.example.com/manifest.json&x=139.7&y=35.6&z=12&id=feature123
```

In the above example:
- Loads the specified Manifest file
- Centers the map on Tokyo (longitude 139.7, latitude 35.6)
- Displays at zoom level 12
- Initially selects the feature with ID "feature123"

### URL Parameter Persistence

During application use, the following state changes are automatically reflected in the URL:
- Map position and zoom level
- Selected feature
- Image rotation angle
- Auto-rotation setting

You can share the current display state with others by copying the browser URL.