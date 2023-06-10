const express = require('express');
const fs = require("fs");
const multer = require("multer");
const { v1: uuidv1 } = require('uuid');

const router = express.Router();
// Storing the JSON format data in empList
const filePath = "./json-files/employees.json";
const fileData = fs.readFileSync(filePath, 'utf8');
var empList = fileData ? JSON.parse(fileData) : [];

// File upload using Multer
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/images/profile_pics');
    },
    filename: function(req, file, cb) {
        fileExt = file.originalname.split('.').pop();
        fileName = file.originalname.split('.')[0] + '-' + Date.now() + '.' + fileExt;
        cb(null, fileName);
    }
});

const uploadProfileImg = multer({
    storage: storage
});

const writeFile = (fileContent) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, fileContent, 'utf8', writeFileError => {
            if (writeFileError) {
                reject(writeFileError);
                return;
            }
            resolve(filePath);
        });
    });
}

/* Fetch employee listing. */
router.get('/employees', (req, res, next) => {
    const emp_list = empList.filter(x => x.isDeleted === false);
    return res.status(200).json({
        empList: emp_list
    })
});

/* Fetch employee details. */
router.get('/employees/:id', (req, res, next) => {
    const empId = req.params["id"];
    if (!empId) {
        return res.status(403).json({
            msg: "Employee details could not found!"
        })
    } else {
        const empDetails = empList.find(x => x.id === empId);
        if (!empDetails) {
            return res.status(403).json({
                msg: "Employee details could not found!"
            })
        }
        return res.status(200).json({
            empDetails
        })
    }
});

/* Add employee details. */
router.post('/employees', uploadProfileImg.single('avatar'), async(req, res, next) => {
    const profilePic = req.file;
    const empDetails = req.body;

    if (!empDetails.fname) {
        return res.status(403).json({
            msg: "First name can't be blank!"
        })
    } else if (!empDetails.lname) {
        return res.status(403).json({
            msg: "Last name can't be blank!"
        })
    } else if (!empDetails.dob) {
        return res.status(403).json({
            msg: "Date of Birth can't be blank!"
        })
    } else if (!empDetails.country) {
        return res.status(403).json({
            msg: "Country can't be blank!"
        })
    } else if (!profilePic) {
        return res.status(403).json({
            msg: "Please select a profile picture!"
        })
    } else {
        let isEmpExist = empList.find(x => x.email === empDetails.email.toLowerCase());

        if (isEmpExist) {
            return res.status(403).json({
                msg: 'Email already exist!'
            })

        } else {
            empList.push({
                id: uuidv1(),
                fname: empDetails.fname,
                lname: empDetails.lname,
                email: empDetails.email.toLowerCase(),
                dob: empDetails.dob,
                country: empDetails.country,
                avatar: `/images/profile_pics/${profilePic.filename}`,
                isDeleted: false
            })

            //empList.push(empList)

            try {
                await writeFile(JSON.stringify(empList));
                return res.status(201).json({
                    msg: "Employee added successfully!"
                })
            } catch (e) {
                return res.status(500).json({
                    msg: 'Internal Server Error!'
                });
            }
        }
    }
});

/* Update employee details. */
router.put('/employees/:id', uploadProfileImg.single('avatar'), async(req, res, next) => {
    const empId = req.params["id"];
    const profilePic = req.file;
    const empDetails = req.body;

    if (!empId) {
        return res.status(403).json({
            msg: "Employee details could not found!"
        })
    } else if (!empDetails.fname) {
        return res.status(403).json({
            msg: "First name can't be blank!"
        })
    } else if (!empDetails.lname) {
        return res.status(403).json({
            msg: "Last name can't be blank!"
        })
    } else if (!empDetails.dob) {
        return res.status(403).json({
            msg: "Date of Birth can't be blank!"
        })
    } else if (!empDetails.country) {
        return res.status(403).json({
            msg: "Country can't be blank!"
        })
    } else {
        const isEmpExist = empList.find(x => x.id === empId);
        const isEmailExist = empList.find(x => x.email === empDetails.email.toLowerCase() && x.id !== empId);

        if (!isEmpExist) {
            return res.status(403).json({
                msg: "Employee details could not found!"
            })
        } else if (isEmailExist) {
            return res.status(403).json({
                msg: 'Email already exist!'
            })
        } else {
            empList.map(empData => {
                if (empData.id === empId) {
                    empData["fname"] = empDetails.fname;
                    empData["lname"] = empDetails.lname;
                    empData["email"] = empDetails.email.toLowerCase();
                    empData["dob"] = empDetails.dob;
                    empData["country"] = empDetails.country;
                    empData["avatar"] = profilePic ? `/images/profile_pics/${profilePic.filename}` : empData["avatar"];
                }
                return empData;
            })

            try {
                await writeFile(JSON.stringify(empList));
                return res.status(200).json({
                    msg: "Employee details updated successfully!"
                })
            } catch (e) {
                return res.status(500).json({
                    msg: 'Internal Server Error!'
                });
            }
        }
    }
});


/* Delete employee */
router.delete('/employees/:id', async(req, res, next) => {
    const empId = req.params["id"];
    if (!empId) {
        return res.status(403).json({
            msg: "Employee details could not found!"
        })
    } else {
        const empDetails = empList.find(x => x.id === empId);
        if (!empDetails) {
            return res.status(403).json({
                msg: "Employee details could not found!"
            })
        }

        empList = empList.map(empData => {
            if (empData.id === empId) {
                empData["isDeleted"] = true;
            }
            return empData;
        })

        try {
            await writeFile(JSON.stringify(empList));
            return res.status(200).json({
                msg: "Employee removed successfully!"
            })
        } catch (e) {
            return res.status(500).json({
                msg: 'Internal Server Error!'
            });
        }
    }
})

module.exports = router;