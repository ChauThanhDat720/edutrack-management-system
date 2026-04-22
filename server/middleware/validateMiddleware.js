const validate = (schema) => (req, res, next) => {
    const { value, error } = schema.validate(req.body, { 
        abortEarly: false, 
        allowUnknown: true, 
        stripUnknown: true 
    });
    
    if (error) {
        const errorMessage = error.details
            .map((details) => details.message.replace(/"/g, ''))
            .join(', ');
        return res.status(400).json({ success: false, message: errorMessage });
    }
    
    // Update req.body with the validated and stripped value
    req.body = value;
    next();
};

module.exports = validate;
