exports.Schema = mongoose.Schema(
		{
			_id:'string',
			accessToken:'string',
			refreshToken:'string',
			username:"string",
			screen_name:"string",
			raw:{}
		},
		{
			strict:false
		}
	);

