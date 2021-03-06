'use strict';

import LoginCtrl from '../../../../src/js/controller/login/login';
import Email from '../../../../src/js/email/gmail';
import Account from '../../../../src/js/email/account';
import Dialog from '../../../../src/js/util/dialog';
import UpdateHandler from '../../../../src/js/util/update/update-handler';
import Auth from '../../../../src/js/service/auth';
import OAuth from '../../../../src/js/service/oauth';
import PrivateKey from '../../../../src/js/service/privatekey';
import GmailClient from '../../../../src/js/email/gmail-client';

describe('Login Controller unit test', function() {
    var scope, location, ctrl,
        emailMock, privateKeyMock, authMock, accountMock, dialogMock, updateHandlerMock, goToStub, gmailClientStub, oauthStub,
        emailAddress = 'fred@foo.com';

    beforeEach(function() {
        emailMock = sinon.createStubInstance(Email);
        accountMock = sinon.createStubInstance(Account);
        oauthStub = sinon.createStubInstance(OAuth);
        authMock = sinon.createStubInstance(Auth);
        privateKeyMock = sinon.createStubInstance(PrivateKey);
        dialogMock = sinon.createStubInstance(Dialog);
        updateHandlerMock = sinon.createStubInstance(UpdateHandler);
        gmailClientStub = sinon.createStubInstance(GmailClient);

        location = {
            path: function() {}
        };

        authMock.emailAddress = emailAddress;
        oauthStub.accessToken = 'token';

        angular.module('login-test', ['woServices', 'woEmail', 'woUtil']);
        angular.mock.module('login-test');
        angular.mock.inject(function($rootScope, $controller) {
            scope = $rootScope.$new();
            scope.state = {};
            scope.form = {};

            ctrl = $controller(LoginCtrl, {
                $scope: scope,
                $location: location,
                updateHandler: updateHandlerMock,
                account: accountMock,
                auth: authMock,
                email: emailMock,
                privateKey: privateKeyMock,
                dialog: dialogMock,
                appConfig: {
                    preventAutoStart: true
                },
                gmailClient: gmailClientStub,
                oauth: oauthStub
            });
        });

        scope.goTo = function() {};
        goToStub = sinon.stub(scope, 'goTo');
    });

    afterEach(function() {});

    it('should fail for auth.init', function(done) {
        authMock.init.returns(rejects(new Error()));

        scope.init().then(function() {
            expect(authMock.init.calledOnce).to.be.true;
            expect(accountMock.init.called).to.be.false;
            expect(dialogMock.error.calledOnce).to.be.true;
            done();
        });
    });

    it('should redirect to /add-account', function(done) {
        authMock.emailAddress = undefined;
        oauthStub.accessToken = undefined;

        authMock.init.returns(resolves());

        scope.init().then(function() {
            expect(authMock.init.calledOnce).to.be.true;
            expect(goToStub.withArgs('/add-account').called).to.be.true;
            done();
        });
    });

    it('should gmailClient.login before fail for account init', function(done) {
        authMock.emailAddress = undefined;
        oauthStub.accessToken = 'token';

        authMock.init.returns(resolves());
        gmailClientStub.login.returns(resolves());
        accountMock.init.returns(rejects(new Error()));

        scope.init().then(function() {
            expect(updateHandlerMock.checkForUpdate.calledOnce).to.be.true;
            expect(authMock.init.calledOnce).to.be.true;
            expect(gmailClientStub.login.called).to.be.true;
            expect(dialogMock.error.calledOnce).to.be.true;
            done();
        });
    });

    it('should redirect to /login-existing', function(done) {
        authMock.init.returns(resolves());
        accountMock.init.returns(resolves({
            publicKey: 'publicKey',
            privateKey: 'privateKey'
        }));
        emailMock.unlock.returns(rejects(new Error()));

        scope.init().then(function() {
            expect(goToStub.withArgs('/login-existing').called).to.be.true;
            expect(goToStub.calledOnce).to.be.true;
            expect(authMock.storeCredentials.called).to.be.false;
            done();
        });
    });

    it('should fail for auth.storeCredentials', function(done) {
        authMock.init.returns(resolves());
        accountMock.init.returns(resolves({
            publicKey: 'publicKey',
            privateKey: 'privateKey'
        }));
        emailMock.unlock.returns(resolves());
        authMock.storeCredentials.returns(rejects(new Error()));

        scope.init().then(function() {
            expect(dialogMock.error.calledOnce).to.be.true;
            done();
        });
    });

    it('should redirect to /account with stored oauth token', function(done) {
        oauthStub.accessToken = undefined;

        authMock.init.returns(resolves());
        accountMock.init.returns(resolves({
            publicKey: 'publicKey',
            privateKey: 'privateKey'
        }));
        emailMock.unlock.returns(resolves());
        authMock.storeCredentials.returns(resolves());

        scope.init().then(function() {
            expect(goToStub.withArgs('/account').called).to.be.true;
            expect(goToStub.calledOnce).to.be.true;
            done();
        });
    });

    it('should redirect to /login-privatekey-download', function(done) {
        authMock.init.returns(resolves());
        accountMock.init.returns(resolves());
        privateKeyMock.init.returns(resolves());
        privateKeyMock.isSynced.returns(resolves(true));
        privateKeyMock.destroy.returns(resolves());

        scope.init().then(function() {
            expect(goToStub.withArgs('/login-privatekey-download').called).to.be.true;
            expect(privateKeyMock.isSynced.calledOnce).to.be.true;
            expect(goToStub.calledOnce).to.be.true;
            done();
        });
    });

    it('should redirect to /login-initial', function(done) {
        authMock.init.returns(resolves());
        accountMock.init.returns(resolves());
        privateKeyMock.init.returns(resolves());
        privateKeyMock.isSynced.returns(resolves(false));
        privateKeyMock.destroy.returns(resolves());

        scope.init().then(function() {
            expect(goToStub.withArgs('/login-initial').called).to.be.true;
            expect(privateKeyMock.isSynced.calledOnce).to.be.true;
            expect(goToStub.calledOnce).to.be.true;
            done();
        });
    });

});