exports.Schema = mongoose.Schema(
		{
			name:'string',
			date:'date',
			user:'string',
			ip:'string'
		},
		{
			strict:false
		}
	);

