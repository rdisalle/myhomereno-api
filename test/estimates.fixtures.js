function makeEstimatesArray() {
    return [
        {
            id: 1,
            project_id: 1,
            name: "Master Bath Estimate 1",
            contractor_name: "Bathroom Specialties",
            price: "$30,000",
            details: "Can start the job in two weeks",
            total_time: "3 Weeks",
            date_created: "2020-01-24T16:28:32.615Z"
        },
        {
            id: 2,
            project_id: 2,
            name: "Master Bath Estimate 1",
            contractor_name: "Bathroom Specialties",
            price: "$30,000",
            details: "Can start the job in two weeks",
            total_time: "3 Weeks",
            date_created: "2020-01-24T16:28:32.615Z"
        },
        {
            id: 3,
            project_id: 3,
            name: "Master Bath Estimate 1",
            contractor_name: "Bathroom Specialties",
            price: "$30,000",
            details: "Can start the job in two weeks",
            total_time: "3 Weeks",
            date_created: "2020-01-24T16:28:32.615Z"
        }
    ];
};

function makeMaliciousEstimate() {
    const maliciousEstimate = {
        id: 911,
            name: 'Naughty naughty very naughty <script>alert("xss");</script>',
            project_id: 3,
            contractor_name: "Bathroom Specialties",
            price: "$30,000",
            details: "Can start the job in two weeks",
            total_time: "3 Weeks",
            date_created: new Date().toISOString()
    };
    const expectedEstimate = {
      ...maliciousEstimate,
      name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    };
    return {
      maliciousEstimate,
      expectedEstimate,
    };
  };
  
  module.exports = {
    makeEstimatesArray,
    makeMaliciousEstimate,
  };