'use strict';

import Auth from '../../../../src/js/service/auth';
import Account from '../../../../src/js/email/account';
import Dialog from '../../../../src/js/util/dialog';
import LoginExistingCtrl from '../../../../src/js/controller/login/login-existing';
import EmailDAO from '../../../../src/js/email/gmail';
import KeychainDAO from '../../../../src/js/service/keychain';

describe('Login (existing user) Controller unit test', function() {
    var scope, location, ctrl, emailDaoMock, authMock, accountMock, dialogMock,
        emailAddress = 'fred@foo.com',
        passphrase = 'asd',
        keychainMock;

    beforeEach(function() {
        emailDaoMock = sinon.createStubInstance(EmailDAO);
        authMock = sinon.createStubInstance(Auth);
        keychainMock = sinon.createStubInstance(KeychainDAO);
        accountMock = sinon.createStubInstance(Account);
        dialogMock = sinon.createStubInstance(Dialog);

        authMock.emailAddress = emailAddress;

        angular.module('loginexistingtest', ['woServices']);
        angular.mock.module('loginexistingtest');
        angular.mock.inject(function($rootScope, $controller, $location) {
            location = $location;
            scope = $rootScope.$new();
            scope.state = {};
            scope.form = {};
            ctrl = $controller(LoginExistingCtrl, {
                $scope: scope,
                $routeParams: {},
                $q: window.qMock,
                email: emailDaoMock,
                auth: authMock,
                keychain: keychainMock,
                account: accountMock,
                dialog: dialogMock,
                appConfig: {}
            });
        });
    });

    afterEach(function() {});

    describe('initial state', function() {
        it('should be well defined', function() {
            expect(scope.incorrect).to.be.undefined;
        });
    });

    describe('confirm passphrase', function() {
        it('should unlock crypto and start', function(done) {
            var keypair = {},
                pathSpy = sinon.spy(location, 'path');
            scope.passphrase = passphrase;
            keychainMock.getUserKeyPair.withArgs(emailAddress).returns(resolves(keypair));
            emailDaoMock.unlock.withArgs({
                keypair: keypair,
                passphrase: passphrase
            }).returns(resolves());
            authMock.storeCredentials.returns(resolves());

            scope.confirmPassphrase().then(function() {
                expect(keychainMock.getUserKeyPair.calledOnce).to.be.true;
                expect(emailDaoMock.unlock.calledOnce).to.be.true;
                expect(pathSpy.calledOnce).to.be.true;
                expect(pathSpy.calledWith('/account')).to.be.true;
                done();
            });
        });

        it('should not work when keypair unavailable', function(done) {
            scope.passphrase = passphrase;
            keychainMock.getUserKeyPair.withArgs(emailAddress).returns(rejects(new Error('asd')));

            scope.confirmPassphrase().then(function() {
                expect(scope.errMsg).to.exist;
                expect(keychainMock.getUserKeyPair.calledOnce).to.be.true;
                done();
            });
        });
    });
});