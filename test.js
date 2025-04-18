import { processJumpData } from "./utils/formatJson.js";
import { handleNewJump } from "./utils/monitor.js";
import dotenv from 'dotenv';

dotenv.config();

const jsonData = {
    "queries": 6,
    "loads": [
        {
            "id": "211372",
            "name": "G-FBPS 5",
            "status": "Building",
            "is_no_time": "1",
            "aircraft_id": "9421",
            "expected_take_off": "1739541600",
            "stop_at": "0",
            "loading_gate_id": 0,
            "landing_zone_id": 0,
            "dzso_id": 0,
            "gca_id": 0,
            "lm_id": 9152394,
            "reserve_slots": 5,
            "max_slots": "15",
            "private_slots": "5",
            "public_slots": "9",
            "is_turning": "1",
            "is_fueling": "0",
            "aircraft_name": "",
            "caculate_expected_take_off": "1739541600",
            "time_left": 0,
            "groups": [
                [
                    {
                        "id": "5122712",
                        "jump": "TAN",
                        "name": "Test user",
                        "tribe": "",
                        "is_public": "0",
                        "is_private": "1",
                        "transaction_type_id": "11",
                        "type": "Tandem",
                        "option_name": "",
                        "formation_type_id": "0",
                        "rig_id": "0",
                        "team_id": "0",
                        "sale_id": "183306",
                        "team_name": "",
                        "formation_type_name": "",
                        "rig_name": "",
                        "handycam_jump": "",
                        "group_number": "4-1"
                    },
                    {
                        "id": "5122952",
                        "jump": "TAN",
                        "name": "Kayleigh Garbett",
                        "tribe": "",
                        "is_public": "0",
                        "is_private": "1",
                        "transaction_type_id": "3",
                        "type": "Tandem",
                        "option_name": "",
                        "formation_type_id": "0",
                        "rig_id": "0",
                        "team_id": "0",
                        "sale_id": "1833062",
                        "team_name": "",
                        "formation_type_name": "",
                        "rig_name": "",
                        "handycam_jump": "",
                        "group_number": "4-1"
                    },
                    {
                        "id": "5122953",
                        "jump": "VID",
                        "name": "Jake Orton",
                        "tribe": "",
                        "is_public": "0",
                        "is_private": "1",
                        "transaction_type_id": "3",
                        "type": "Tandem",
                        "option_name": "",
                        "formation_type_id": "0",
                        "rig_id": "0",
                        "team_id": "0",
                        "sale_id": "1833062",
                        "team_name": "",
                        "formation_type_name": "",
                        "rig_name": "",
                        "handycam_jump": "",
                        "group_number": "4-1"
                    }
                ],
                [
                    {
                        "id": "5123122",
                        "jump": "SL",
                        "name": "Lucas Fisher",
                        "tribe": "",
                        "is_public": "1",
                        "is_private": "0",
                        "transaction_type_id": "12",
                        "type": "Student",
                        "option_name": "",
                        "formation_type_id": "0",
                        "rig_id": "0",
                        "team_id": "0",
                        "sale_id": "1833212",
                        "team_name": "",
                        "formation_type_name": "",
                        "rig_name": "",
                        "handycam_jump": "",
                        "group_number": ""
                    }
                ],
                [
                    {
                        "id": "5122272",
                        "jump": "Level 2",
                        "name": "Omeed Hassani",
                        "tribe": "",
                        "is_public": "0",
                        "is_private": "1",
                        "transaction_type_id": "12",
                        "type": "Student",
                        "option_name": "",
                        "formation_type_id": "2",
                        "rig_id": "0",
                        "team_id": "0",
                        "sale_id": "1832902",
                        "team_name": "",
                        "formation_type_name": "AFF",
                        "rig_name": "",
                        "handycam_jump": "",
                        "group_number": ""
                    },
                    {
                        "id": "5123152",
                        "jump": "AFFI",
                        "name": "Peter Harries",
                        "tribe": "",
                        "is_public": "0",
                        "is_private": "1",
                        "transaction_type_id": "3",
                        "type": "Student",
                        "option_name": "",
                        "formation_type_id": "0",
                        "rig_id": "0",
                        "team_id": "0",
                        "sale_id": "1832902",
                        "team_name": "",
                        "formation_type_name": "",
                        "rig_name": "",
                        "handycam_jump": "",
                        "group_number": ""
                    },
                    {
                        "id": "5123162",
                        "jump": "AFFI",
                        "name": "Laura Hampton",
                        "tribe": "",
                        "is_public": "0",
                        "is_private": "1",
                        "transaction_type_id": "3",
                        "type": "Student",
                        "option_name": "",
                        "formation_type_id": "0",
                        "rig_id": "0",
                        "team_id": "0",
                        "sale_id": "1832902",
                        "team_name": "",
                        "formation_type_name": "",
                        "rig_name": "",
                        "handycam_jump": "",
                        "group_number": ""
                    }
                ],
                [
                    {
                        "id": "5122992",
                        "jump": "EXP - KIT",
                        "name": "Stuart Cross",
                        "tribe": "",
                        "is_public": "1",
                        "is_private": "0",
                        "transaction_type_id": "1",
                        "type": "Sport Jumper",
                        "option_name": "",
                        "formation_type_id": "0",
                        "rig_id": "0",
                        "team_id": "0",
                        "sale_id": "1833142",
                        "team_name": "",
                        "formation_type_name": "",
                        "rig_name": "",
                        "handycam_jump": "",
                        "group_number": ""
                    }
                ],
                [
                    {
                        "id": "5123012",
                        "jump": "EXP - KIT",
                        "name": "Georgia Glynn",
                        "tribe": "",
                        "is_public": "1",
                        "is_private": "0",
                        "transaction_type_id": "1",
                        "type": "Sport Jumper",
                        "option_name": "",
                        "formation_type_id": "0",
                        "rig_id": "0",
                        "team_id": "0",
                        "sale_id": "1833152",
                        "team_name": "",
                        "formation_type_name": "",
                        "rig_name": "",
                        "handycam_jump": "",
                        "group_number": ""
                    }
                ],
                [
                    {
                        "id": "5123042",
                        "jump": "STA",
                        "name": "Timothy Johnson",
                        "tribe": "",
                        "is_public": "1",
                        "is_private": "0",
                        "transaction_type_id": "1",
                        "type": "Sport Jumper",
                        "option_name": "",
                        "formation_type_id": "0",
                        "rig_id": "0",
                        "team_id": "0",
                        "sale_id": "1833172",
                        "team_name": "",
                        "formation_type_name": "",
                        "rig_name": "",
                        "handycam_jump": "",
                        "group_number": ""
                    }
                ],
                [
                    {
                        "id": "5123062",
                        "jump": "EXP",
                        "name": "Jasmine Manders",
                        "tribe": "",
                        "is_public": "1",
                        "is_private": "0",
                        "transaction_type_id": "1",
                        "type": "Sport Jumper",
                        "option_name": "",
                        "formation_type_id": "0",
                        "rig_id": "0",
                        "team_id": "0",
                        "sale_id": "1833182",
                        "team_name": "",
                        "formation_type_name": "",
                        "rig_name": "",
                        "handycam_jump": "",
                        "group_number": ""
                    }
                ],
                [
                    {
                        "id": "5123082",
                        "jump": "EXP",
                        "name": "Josh Allan",
                        "tribe": "",
                        "is_public": "1",
                        "is_private": "0",
                        "transaction_type_id": "1",
                        "type": "Sport Jumper",
                        "option_name": "",
                        "formation_type_id": "23",
                        "rig_id": "0",
                        "team_id": "0",
                        "sale_id": "1833192",
                        "team_name": "",
                        "formation_type_name": "FS",
                        "rig_name": "",
                        "handycam_jump": "",
                        "group_number": "BM8-1"
                    }
                ],
                [
                    {
                        "id": "5123102",
                        "jump": "EXP",
                        "name": "Alan Veyrat",
                        "tribe": "",
                        "is_public": "1",
                        "is_private": "0",
                        "transaction_type_id": "1",
                        "type": "Sport Jumper",
                        "option_name": "",
                        "formation_type_id": "53",
                        "rig_id": "0",
                        "team_id": "0",
                        "sale_id": "1833202",
                        "team_name": "",
                        "formation_type_name": "",
                        "rig_name": "",
                        "handycam_jump": "",
                        "group_number": "BM9-1"
                    }
                ],
                [
                    {
                        "id": "5123142",
                        "jump": "INST",
                        "name": "Ryan Garner",
                        "tribe": "",
                        "is_public": "1",
                        "is_private": "0",
                        "transaction_type_id": "1",
                        "type": "Sport Jumper",
                        "option_name": "",
                        "formation_type_id": "0",
                        "rig_id": "0",
                        "team_id": "0",
                        "sale_id": "1833222",
                        "team_name": "",
                        "formation_type_name": "",
                        "rig_name": "",
                        "handycam_jump": "",
                        "group_number": ""
                    }
                ],
                [
                    {
                        "id": "5123192",
                        "jump": "STA",
                        "name": "Peter Angeli",
                        "tribe": "",
                        "is_public": "1",
                        "is_private": "0",
                        "transaction_type_id": "1",
                        "type": "Sport Jumper",
                        "option_name": "",
                        "formation_type_id": "0",
                        "rig_id": "0",
                        "team_id": "0",
                        "sale_id": "1833232",
                        "team_name": "",
                        "formation_type_name": "",
                        "rig_name": "",
                        "handycam_jump": "",
                        "group_number": ""
                    }
                ]
            ],
            "slots": {
                "private_slots": "5",
                "public_slots": "9"
            },
            "total_slots": 14,
            "dzso": "",
            "gca": "",
            "lm": "Jasmine Manders"
        },
        {
            "id": "211382",
            "name": "G-FBPS 6",
            "status": "Building",
            "is_no_time": "1",
            "aircraft_id": "9421",
            "expected_take_off": "1739542968",
            "stop_at": "0",
            "loading_gate_id": 0,
            "landing_zone_id": 0,
            "dzso_id": 0,
            "gca_id": 0,
            "lm_id": 0,
            "reserve_slots": 0,
            "max_slots": "15",
            "private_slots": "0",
            "public_slots": "3",
            "is_turning": "1",
            "is_fueling": "0",
            "aircraft_name": "",
            "caculate_expected_take_off": "1739542968",
            "time_left": 41,
            "groups": [
                [
                    {
                        "id": "5122312",
                        "jump": "Level 2",
                        "name": "Keith Attwood",
                        "tribe": "",
                        "is_public": "1",
                        "is_private": "0",
                        "transaction_type_id": "12",
                        "type": "Student",
                        "option_name": "",
                        "formation_type_id": "2",
                        "rig_id": "0",
                        "team_id": "0",
                        "sale_id": "1832912",
                        "team_name": "",
                        "formation_type_name": "AFF",
                        "rig_name": "",
                        "handycam_jump": "",
                        "group_number": ""
                    },
                    {
                        "id": "5123172",
                        "jump": "AFFI",
                        "name": "Peter Harries",
                        "tribe": "",
                        "is_public": "1",
                        "is_private": "0",
                        "transaction_type_id": "3",
                        "type": "Student",
                        "option_name": "",
                        "formation_type_id": "0",
                        "rig_id": "0",
                        "team_id": "0",
                        "sale_id": "1832912",
                        "team_name": "",
                        "formation_type_name": "",
                        "rig_name": "",
                        "handycam_jump": "",
                        "group_number": ""
                    },
                    {
                        "id": "5123182",
                        "jump": "AFFI",
                        "name": "Laura Hampton",
                        "tribe": "",
                        "is_public": "1",
                        "is_private": "0",
                        "transaction_type_id": "3",
                        "type": "Student",
                        "option_name": "",
                        "formation_type_id": "0",
                        "rig_id": "0",
                        "team_id": "0",
                        "sale_id": "1832912",
                        "team_name": "",
                        "formation_type_name": "",
                        "rig_name": "",
                        "handycam_jump": "",
                        "group_number": ""
                    }
                ]
            ],
            "slots": {
                "private_slots": "0",
                "public_slots": "3"
            },
            "total_slots": 3,
            "dzso": "",
            "gca": "",
            "lm": ""
        },
        [],
        []
    ],
    "version": 278,
    "session_id": 12622,
    "cache_index": "DZM2_JMP_12622_278_f45eaeb220c0ce6b1da2c1bb1df02bad_29d3bf6beeefda379356cb33ad83c301",
    "cached": 1,
    "user": {
        "user_type": 2,
        "dropzone_status": 1
    },
    "success": true,
    "dropzone_id": null,
    "server": "prod4-2022 (AWS)",
    "operation_time": "27.125835418701ms"
};

const createConfig = env => ({
    jumpersName: env.JUMPERS_NAME,
    canopy: env.CANOPY,
    dzId: env.DZ_ID,
    description: env.DESCRIPTION,
    logbookSpreadsheetId: env.LOGBOOK_SPREADSHEET_ID,
    moneyEarntSpreadsheetId: env.MONEY_EARNT_SPREADSHEET_ID,
    invoiceSpreadsheetId: env.INVOICE_SPREADSHEET_ID
});

const mockFunction = async () => {
    const config = createConfig(process.env);

    let processedLoads = new Set();
    let cameraCount = 0;

    const jumpData = processJumpData(jsonData, config);
    const newState = await handleNewJump(processedLoads, cameraCount)(jumpData);

    // Update state values
    processedLoads = newState.processedLoads;
    cameraCount = newState.cameraCount;
}

mockFunction();