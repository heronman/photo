(function ($) {
	let AUTH_CODES = [
		{ code: 1, acode: 'logoff', reason: null },
		{ code: 0, acode: 'ok', reason: null },
		{ code: -1, acode: 'not-logged-in', reason: 'Для данной операции требуется авторизация' },
		{ code: -2, acode: 'bad-login', reason: 'Неверный логин или пароль' },
		{ code: -3, acode: 'login-limit', reson: 'Превышен лимит попыток авторизации' },
		{ code: -4, acode: 'not-authorized', reason: 'Доступ запрещен' },
		{ code: -5, acode: 'broken-uid', reason: 'Неверный идентификатор пользователя' },
		{ code: -6, acode: 'timeout', reason: 'Сессия истекла. Пожалуйста, авторизуйтесь заново' },
		{ code: -999, acode: 'n/a', reason: 'Неизвестная ошибка' },
	];

	let ajaxActive = false;
	// let ajaxOptions = {
	// 	type: 'POST',
	// 	dataType: 'json',
	// 	url: '/admin/',
	// };

	// $(document.body).ajaxStart(function() { ajaxActive = true; });
	// $(document.body).ajaxComplete(function() { ajaxActive = false; });

	// function getAuthReason(status) {
	// 	if(status === null) return null;
	// 	if('string' == typeof status) {
	// 		let fields = status.split('.');
	// 		if(fields.length > 2
	// 			&& fields[0] == 'err'
	// 			&& fields[1] == 'auth'
	// 		) status = fields[2];
	// 	}
	// 	let code = parseInt(status);
	// 	for(let i = 0;i < AUTH_CODES.length;i++) {
	// 		if(!isNaN(code) && AUTH_CODES[i].code === code
	// 			|| AUTH_CODES[i].acode == status
	// 		) return AUTH_CODES[i].reason;
	// 	}
	// 	return null;
	// }
    //
	// function extractAuthError(req) {
	// 	let reason = null;
	// 	if(req.status == 401 || req.status == 403) {
	// 		let status = null;
	// 		if(req.responseText) try {
	// 			let data = eval("(function() { return "+req.responseText+"; })()");
	// 			if(data) {
	// 				if(data.hasOwnProperty('auth') && data.auth.hasOwnProperty('status'))
	// 					status = data.auth.status;
	// 				else if(data.hasOwnProperty('status'))
	// 					status = data.status;
	// 			}
	// 		} catch(err) {}
	// 		reason = getAuthReason(status);
	// 		if(reason === null) {
	// 			if(status === null)
	// 				reason = req.status;
	// 			else reason = status;
	// 		}
	// 	} else reason = req.status;
	// 	return reason;
	// }
    //
	// function doLogin(success, error) {
	// 	let login = $("input[name=\"login\"]", this).val();
	// 	let password = $("input[name=\"password\"]", this).val();
	// 	let that = $(this);
	// 	let status = $("div.status", this);
	// 	if(!status.length) status = $("<div>").addClass('status').appendTo(this);
	// 	$.ajax({
	// 		type: 'POST',
	// 		url: '/login/',
	// 		data: { login: login, password: password, json: true },
	// 		dataType: 'json',
	// 		error: function(req) {
	// 			if(typeof error == 'function' && error.apply(this, arguments) === false)
	// 				return;
	// 			status.text('Ошибка аутентификации ('+extractAuthError(req)+')');
	// 		},
	// 		success: function(data) {
	// 			if(data.status == 'ok') { //data.auth && data.auth.uid > 0) {
	// 				that.dialog('option', 'beforeClose', function() { return true; })
	// 					.dialog('close').dialog('destroy').remove();
	// 				if(typeof success == 'function') success.apply(this, arguments);
	// 			} else {
	// 				let reason = getAuthReason(data.auth.status);
	// 				status.text(reason ? reason : 'Ошибка аутентификации');
	// 			}
	// 		}
	// 	});
	// }
    //
	// function loginDialog(reason, success, error) {
	// 	$("<div>")
	// 		.append($("<div>").addClass('form')
	// 			.append($('<div>').addClass('field')
	// 				.append($('<span>').addClass('label').text('Логин'))
	// 				.append($('<input>').attr('type', 'text').attr('name', 'login').addClass('value'))
	// 			)
	// 			.append($('<div>').addClass('field')
	// 				.append($('<span>').addClass('label').text('Пароль'))
	// 				.append($('<input>').attr('type', 'password').attr('name', 'password').addClass('value'))
	// 			)
	// 		)
	// 		.append($("<div>").addClass('status').text(reason))
	// 		.dialog({
	// 			modal: true,
	// 			title: "Аутентификация",
	// 			beforeClose: function() { return false; },
	// 			resizable: false,
	// 			buttons: [
	// 				{ text: 'Ok', click: function() { doLogin.call(this, success, error); } }
	// 			]
	// 		});
	// }
    //
	// window.ajaxEx = function(opts) {
	// 	let options = $.extend({}, ajaxOptions, opts);
	// 	options.data = opts.data;
	// 	options.error = function(req, status, err) {
	// 		if(opts.error && typeof opts.error == 'function'
	// 				&& opts.error.apply(this, arguments) === false)
	// 			return;
	// 		if(req.status == 401) {
	// 			loginDialog(extractAuthError(req), function() { ajaxEx(opts); });
	// 			return;
	// 		} else if(req.status == 403)
	// 			status = getAuthReason('not-authorized');
	// 		alert("Ошибка запроса AJAX: "+req.status+(status ? " ("+status+")" : "")+(err ? " - "+err : ""));
	// 	}
	// 	options.success = function(data) {
	// 		if(data.status && data.status == 'error' && data.error == 'auth') {
	// 		// auth request with HTTP 200
	// 			loginDialog(getAuthReason(data.auth.status), function() { ajaxEx(opts); });
	// 			return;
	// 		}
	// 		if(opts.success && typeof opts.success == 'function')
	// 			opts.success.apply(this, arguments);
	// 	}
	// 	if(opts.section) {
	// 		options.url += opts.section;
	// 		options.url = options.url.replace(/[/]+/g, '/');
	// 		delete options.section;
	// 	}
	// 	$.ajax(options);
	// };

	let deferred = [];
	let listUrl = "photo/";

	window.Admin = {
        get listUrl() {
            return listUrl;
        },
        set listUrl(url) {
            listUrl = url;
            if (url) {
                for (let callback of deferred)
                    callback();
                deferred = [];
            }
        },
        defer: function(callback) {
            if (this.listUrl)
                callback();
            else
                deferred.push(callback);
        }
	};

})(jQuery);
