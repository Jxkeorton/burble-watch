const convertTimestampToDateString = (timestamp) => {
    return new Date(timestamp * 1000).toISOString().split('T')[0];
}

export const checkName = (name, loads) => {
    for (let load of loads) {
        if (load.time_left < 0){
            for (let group of load.groups) {
                if (group.name === name) {
                    return load;
                }
            }
        }
    }
    return null;
};

export const formatData = (loadData, canopy, DZID, description) => {
    const DZ = ''

    if (DZID === 531 ){
        DZ = 'Skydive Langar';
    }

    const date = convertTimestampToDateString(loadData.expected_take_off);
    const PlaneName = loadData.name;
    const jumpType = loadData.groups[0].type;

    const newJump = {
        date,
        DZ,
        PlaneName,
        jumpType,
        canopy,
        description
    }

    return newJump;
};