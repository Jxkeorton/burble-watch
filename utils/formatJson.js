const convertTimestampToDateString = (timestamp) => {
    return new Date(timestamp * 1000).toISOString().split('T')[0];
}

const checkName = (name, loads) => {
    for (let load of loads) {
        // Skip empty loads
        if (!load.groups) continue;
        
        // Check if load still has time left
        if (load.time_left < 0) {
            // Iterate through each group in the load
            for (let group of load.groups) {
                // Iterate through each jumper in the group
                for (let jumper of group) {
                    if (jumper.name === name) {

                        const jumpType = jumper.type

                        return {loadData: load, jumpType};
                    }
                }
            }
        }
    }
    return null;
};

const formatData = (loadData, canopy, DZID, description, jumpType) => {
    let dz = ''

    console.log(DZID)

    if (DZID == 531 ){
        dz = 'Skydive Langar';
    } else {
        dz = DZID.toString();
    }

    const date = convertTimestampToDateString(loadData.expected_take_off);
    const planeName = loadData.name;

    const newJump = {
        date,
        dz,
        planeName,
        jumpType,
        canopy,
        description
    }

    return newJump;
};

function countCameraFlying() {
    return todaysLoads.reduce((count, load) => {
        return load.cameraFlying === true ? count + 1 : count;
    }, 0);
}

const processJumpData = (responseData, config) => {
    const { loadData, jumpType } = checkName(config.jumpersName, responseData.loads);
    
    if (!loadData) {
        return null;
    }

    return {
        jump: formatData(
            loadData, 
            config.canopy, 
            config.dzId, 
            config.description, 
            jumpType
        ),
        loadId: loadData.id,
        isCamera: jumpType === 'Camera'
    };
};

module.exports = { countCameraFlying, processJumpData};