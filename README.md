# Instructions for reuse
Running this script will monitor burble, once your name appears on a load it will update your logbook and there is also functionality to update my camera invoice so delete it if you dont need it.

## Step 1 
- Pull code from repo
- Change the name parameter within monitor.js

## Step 2 - Google cloud console
- Create google cloud console project 
- Enable google sheets API
- Create service account
- Export the credentials.json

## Step 3 
- Add the credentials.json within the spreadsheets directory

## Step 4
- Change the spreadsheet ID for your google sheets (within the url of the google sheet you want to edit)

## Step 5
- Have correct logbook layout:

(export your jumps from burble to make the logbook setup quick)

<details>
<summary>Image dropdown</summary>

![Logbook Layout](./docs/Logbook-example.png)

</details>

## Step 6 
- Remove the if statement that checks for camera jumps in the monitor.js