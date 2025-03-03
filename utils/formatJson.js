const convertTimestampToDateString = (timestamp) => {
    return new Date(timestamp * 1000).toISOString().split('T')[0];
};

const checkName = (name, loads) => {
    let studentName = '';

    for (let load of loads) {
        // Skip empty loads
        if (!load.groups) continue;
        
        // Check if load still has time left
        if (load.time_left < 1) {
            // Iterate through each group in the load
            for (let group of load.groups) {
                // Iterate through each jumper in the group
                for (let jumper of group) {
                    if (jumper.name === name) {
                        const jumpType = jumper.jump;

                        if(jumpType === 'VID'){
                            studentName = group[0].name;
                        }

                        return { loadData: load, jumpType, studentName };
                    }
                }
            }
        }
    }
    return null;
};

const formatData = (loadData, canopy, DZID, description, jumpType) => {
    let dz = '';

    if (DZID == 531) {
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
    };

    return newJump;
};

const processJumpData = (responseData, config) => {
    const loads = Array.isArray(responseData.loads) ? responseData.loads : [];
    const result = checkName(config.jumpersName, loads);

    if (!result) {
        return null;
    }

    const { loadData, jumpType, studentName } = result;

    return {
        jump: formatData(
            loadData, 
            config.canopy, 
            config.dzId, 
            config.description, 
            jumpType
        ),
        loadId: loadData.id,
        isCamera: jumpType === 'VID',
        studentName
    };
};

export { processJumpData };