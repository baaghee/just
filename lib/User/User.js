exports.Schema = mongoose.Schema(
		{
			fbid:'number',
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

