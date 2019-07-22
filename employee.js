'use strict';

const express = require('express');
const router = express.Router();

var application = express();
application.set('view engine', 'jade');
application.use(express.json());
application.use(express.urlencoded({extended: false}));

//Set application to listen on port 3000
application.listen(3000);

var httpRequest = require('request');

// Employees Object. Used an in-memory object since persistence was not a requirement.
var employees = {
		  123456: {
		    firstName: 'Jane',
		    lastName:  'Doe',
		    hireDate: '2018-01-01',
		    role: 'LACKEY',
		    favoriteQuote:'This is a dummy quote for Jane',
		    favoriteJoke: 'This is a dummy joke for Jane'
		  },
		234567: {
			firstName: 'David',
			lastName: 'Goliath',
			hireDate: '2017-03-15',
			role: 'MANAGER',
			favoriteQuote:'This is a dummy quote for David',
		    favoriteJoke: 'This is a dummy joke for David'
		},
		345678: {
			firstName: 'Mickey',
			lastName: 'Mouse',
			hireDate: '2010-06-30',
			role: 'LACKEY',
			favoriteQuote:'This is a dummy quote for Mickey',
		    favoriteJoke: 'This is a dummy joke for Mickey'
		},
		456789: {
			firstName: 'Minnie',
			lastName: 'Mouse',
			hireDate: '2007-04-30',
			role: 'CEO',
			role: 'LACKEY',
			favoriteQuote:'This is a dummy quote for Minnie',
		    favoriteJoke: 'This is a dummy joke for Minnie'
		}
};

// Get all current Employee records
router.get('/api/employees', function(request, response, next) {
	return response.render('Employees',{title:'Employee Records', data: employees})
});

// Get Employee record by id
router.get('/api/employees/:id', function(request, response, next) {
	  var employeeId = request.params.id;
	  findEmployeeById(employeeId, function(error, employee) {
	    if (error) return next(error);
	    var employeeList = {employeeId: {firstName:employee.firstName,
										lastName:employee.lastName,
										hireDate:employee.hireDate,
										role: employee.role,
										favoriteQuote:employee.favoriteQuote,
										favoriteJoke:employee.favoriteJoke}};
	    return response.render('Employees',{title:'Employee Record for '+employeeId, data: employeeList})
	  });
});

//Create a new Employee record when coming through /api/employees
router.post('/api/employees', function(request, response) {
	  var employeeId = generateEmployeeId();
	  var employeeInfo = request.body;
	  var validationMessage = validateInfo(employeeInfo);
	  if (validationMessage === "Valid values") {
	  	employees[employeeId]= {firstName:employeeInfo.firstName,
	  							lastName:employeeInfo.lastName,
	  							hireDate:employeeInfo.hireDate,
	  							role: employeeInfo.role};
	  	setFavoriteQuote(employeeId);
	  	setFavoriteJoke(employeeId);
	} else {
		return response.render('InvalidData',{title:'Error'+employeeId, message: validationMessage})
	}
	 response.render('MainPage',
		{title:'Employee Records',data: employees})
});

//Update an existing employee record
// This should be enhanced to validate the input and then update
router.put('/api/employees/:id', function(request, response) {
	 var employeeId = request.params.id;
	  findEmployeeById(employeeId, function(error, employee) {
	    if (error) console.log("Error updating record for: "+employeeId+". Error: "+error);
	  var newInfo = request.body[0];
	  employees[employeeId].firstName = newInfo.firstName;
	  employees[employeeId].lastName = newInfo.lastName;
	  employees[employeeId].hireDate = newInfo.hireDate;
	  employees[employeeId].role = newInfo.role;
	  response.render('MainPage',
				{title:'Employee Records',data: employees})
	});
});

//Delete an Employee record
router.delete('/api/employees/:id', function(request, response) {
	 var employeeId = request.params.id;
	  findEmployeeById(employeeId, function(error, employee) {
		  if (error) console.log("Error deleting record for: "+employeeId+". Error: "+error);
	  delete(employees[employeeId].firstName);
	  delete(employees[employeeId].lastName);
	  delete(employees[employeeId].hireDate);
	  delete(employees[employeeId].role);
	  delete(employees[employeeId].favoriteQuote);
	  delete(employees[employeeId].favoriteJoke)
	  delete(employees[employeeId]);
	  response.render('MainPage',
				{title:'Employee Records',data: employees})
	});
});

//Landing page
router.get('/', function (request, response) {
	response.render('MainPage',
			{title:'Employee Records',data: employees})
	});

function setFavoriteQuote(employeeId) {
	   httpRequest({uri: 'https://ron-swanson-quotes.herokuapp.com/v2/quotes',
					method: 'GET'
					}, function (error, httpResponse, body) {
							console.log('Error getting favorite quote:'+error); // Log Error
							var employee = employees[employeeId];
							employees[employeeId].favoriteQuote=body;
						});
}

function setFavoriteJoke(employeeId) {
	   httpRequest({headers: {'Accept': 'text/plain'},
					uri: 'https://icanhazdadjoke.com/',
					method: 'GET'
					}, function (error, httpResponse, body) {
							console.log('Error getting favorite Joke:' +error); // Log Error
							employees[employeeId].favoriteJoke=body;
						});
}	

/**
 * Generate a random 6 digit id for employee id
 * Check to see if that id already exists. If it does,
 * generate another number.
 */
var generateEmployeeId = function (id) {
	// Made it a 6 digit number
	var randomId = Math.floor(Math.random() * 900000);
	
	/*
	 * Check to see if the id already exists. If it does, continue with the generation of id.
	 * If not, return the random number;
	 */
	while (employees[randomId] != null) {
		randomId = Math.floor(Math.random() * 900000);
	}
	return(randomId);
}

//Find an employee by id. Return error is one doesn't exist
var findEmployeeById = function (id, callback) {
	  if (!employees[id])
	    return callback(new Error(
	      'No employee with id'
	       + id
	      )
	    );
	  return callback(null, employees[id]);
};
	
var validateInfo = function(employeeInfo) {
	var validationMessage = "Valid values";
	//IMPROVE - this can take a string like "M2" for the name.  
	if (employeeInfo.firstName.trim().match(/[A-Za-z]/) == null)  {
		validationMessage = "First name is not valid";
		return validationMessage;
	}
	if (employeeInfo.lastName.trim().match(/[A-Za-z]/) == null) {
		validationMessage = "Last name is not valid";
		return validationMessage;
	}
	if (employeeInfo.hireDate.match(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/) == null) {
		validationMessage = "Date is not in a valid format. Please enter a date in the format YYYY-MM-DD";
		return validationMessage; 
	} else {
		// Check to see if it is a date in the past
		var hireDate = new Date(employeeInfo.hireDate);
		var today = new Date();
		today.setHours(0,0,0,0);
		if (hireDate > today) {
			validationMessage = "Hire date has to be today's date or before. Please enter a valid date.";
			return validationMessage;
		}
	}
	var submittedEmployeeRole = employeeInfo.role.toString().trim().toUpperCase();
	if (submittedEmployeeRole === "CEO") {
		for (var employee in employees) {
			if (employees[employee].role.trim().toUpperCase() === ("CEO")) {
				validationMessage = "CEO already exists. Please choose a valid role";
				return validationMessage;
			}
		}
	} else if (!(submittedEmployeeRole === "VP") &&
			   (submittedEmployeeRole === "MANAGER") &&
			   (submittedEmployeeRole === "LACKEY")) {
				validationMessage = "Role should be CEO, VP, MANAGER or LACKEY. Please enter a valid role";
				return validationMessage;
	}
	return validationMessage;
}

//This applies the router to the application
application.use('/', router);

module.exports = router;
