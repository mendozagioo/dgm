'use strict';

define( function () {
    return function ( $scope, Users ) {
        $scope.create   = function () {
            $scope.new_user.type    = parseInt( $scope.new_user.type, 10 );
            Users.create( $scope.new_user );
        };

        $scope.$on( Users.getEvent( 'CREATED' ), function () {
            $scope.$state.go( 'users.list' );
        });
    };
});