import dotenv from 'dotenv';

dotenv.config();

const convertTimestampToDateString = (timestamp) => {
    return new Date(timestamp * 1000).toISOString().split('T')[0];
};

const checkName = (name, loads) => {
    for (let load of loads) {
        // Skip empty loads
        if (!load.groups) continue;

        // Ensure time is less than 3 minutes to avoid pointless log due to weather holds etc
        if (load.time_left < 10) {
            for (let group of load.groups) {
                for (let jumper of group) {                    
                    if (jumper.name === name) {
                        let jumpType = jumper.jump;
                        const sale_id = jumper.sale_id


                        let studentName = '';
                        if(jumpType === 'VID'){
                            if (sale_id === group[0].sale_id){
                                studentName = group[0].name;
                                console.log('Student Name:', studentName);
                            } else {
                                jumpType = 'VID'
                            }
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

const processJumpData = (responseData) => {
    const loads = Array.isArray(responseData.loads) ? responseData.loads : [];

    const result = checkName(process.env.JUMPERS_NAME, loads);

    if (!result) {
        return null;
    }

    const { loadData, jumpType, studentName } = result;

    return {
        jump: formatData(
            loadData, 
            process.env.CANOPY, 
            process.env.DZ_ID, 
            process.env.DESCRIPTION, 
            jumpType
        ),
        loadId: loadData.id,
        isCamera: jumpType === 'VID',
        studentName
    };
};

export { processJumpData };