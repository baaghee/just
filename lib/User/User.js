exports.Schema = mongoose.Schema(
		{
			type:'string',
			fbid:'number',
			accessToken:'string',
			refreshToken:'string',
			username:"string",
			website:{type:'string', default:''},
			screen_name:"string",
			following:{type:'number', default:0},
			following_l:[{user:{type:mongoose.Schema.Types.ObjectId}, date:{type:'date', default:Date.now}}],
			followers:{type:'number', default:0},
			raw:{},
			featured:'boolean',
			date:'date',
			ip:'string'
		},
		{
			strict:false
		}
	);

