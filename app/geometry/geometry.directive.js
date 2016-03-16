(function () {
    'use strict';

    angular.module('app.geometryModule')
        .directive('geometry', geometry);

    geometry.$inject = ['$log', 'volumeCells', 'volumeStructures', 'volumeHelpers', 'volumeLayers'];
    function geometry($log, volumeCells, volumeStructures, volumeHelpers, volumeLayers) {

        return {
            link: link,
            restrict: 'A',
            scope: {
                broadcastChange: '&',
                model: '=',
                selectedModeChanged: '&',
                selectedCellsChanged: '&',
                selectedChildTypesChanged: '&'
            }
        };


        function link(scope, el, attribute) {

            var camera, scene, renderer;
            var geometry, material, mesh;
            var controls;

            var objects = [];

            var blocker = document.getElementById('blocker');
            var instructions = document.getElementById('instructions');

            // http://www.html5rocks.com/en/tutorials/pointerlock/intro/

            var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

            if (havePointerLock) {

                var element = el[0];

                var pointerlockchange = function (event) {

                    console.log("change");

                    if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {

                        controlsEnabled = true;
                        controls.enabled = true;

                        blocker.style.display = 'none';

                    } else {

                        controls.enabled = false;

                        blocker.style.display = '-webkit-box';
                        blocker.style.display = '-moz-box';
                        blocker.style.display = 'box';

                        instructions.style.display = '';

                    }

                };

                var pointerlockerror = function (event) {

                    instructions.style.display = '';

                };

                // Hook pointer lock state change events
                document.addEventListener('pointerlockchange', pointerlockchange, false);
                document.addEventListener('mozpointerlockchange', pointerlockchange, false);
                document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

                document.addEventListener('pointerlockerror', pointerlockerror, false);
                document.addEventListener('mozpointerlockerror', pointerlockerror, false);
                document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

                instructions.addEventListener('click', function (event) {

                    instructions.style.display = 'none';

                    // Ask the browser to lock the pointer
                    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

                    if (/Firefox/i.test(navigator.userAgent)) {

                        var fullscreenchange = function (event) {

                            if (document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element) {

                                document.removeEventListener('fullscreenchange', fullscreenchange);
                                document.removeEventListener('mozfullscreenchange', fullscreenchange);

                                element.requestPointerLock();
                            }

                        };

                        document.addEventListener('fullscreenchange', fullscreenchange, false);
                        document.addEventListener('mozfullscreenchange', fullscreenchange, false);

                        element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

                        element.requestFullscreen();

                    } else {

                        element.requestPointerLock();

                    }

                }, false);

            } else {

                instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

            }

            init();
            animate();

            var controlsEnabled = false;

            var moveForward = false;
            var moveBackward = false;
            var moveLeft = false;
            var moveRight = false;
            var moveUp = false;
            var moveDown = false;
            var canJump = false;

            var prevTime = performance.now();
            var velocity = new THREE.Vector3();




            function init() {


                camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100000);
                scene = new THREE.Scene();
                controls = new THREE.PointerLockControls(camera);
                scene.add(controls.getObject());

                var onKeyDown = function (event) {


                    switch (event.keyCode) {

                        case 69: // e
                            moveDown = true;
                            break;

                        case 81: // q
                            moveUp = true;
                            break;


                        case 38: // up
                        case 87: // w
                            moveForward = true;
                            break;

                        case 37: // left
                        case 65: // a
                            moveLeft = true;
                            break;

                        case 40: // down
                        case 83: // s
                            moveBackward = true;
                            break;

                        case 39: // right
                        case 68: // d
                            moveRight = true;
                            break;

                    }

                };

                var onKeyUp = function (event) {

                    switch (event.keyCode) {
                        case 69: // e
                            moveDown = false;
                            break;

                        case 81: // q
                            moveUp = false;
                            break;

                        case 38: // up
                        case 87: // w
                            moveForward = false;
                            break;

                        case 37: // left
                        case 65: // a
                            moveLeft = false;
                            break;

                        case 40: // down
                        case 83: // s
                            moveBackward = false;
                            break;

                        case 39: // right
                        case 68: // d
                            moveRight = false;
                            break;

                    }

                };

                document.addEventListener('keydown', onKeyDown, false);
                document.addEventListener('keyup', onKeyUp, false);


                var mesh = volumeLayers.getLowerBoundsMesh();
                for(var i=0; i<mesh.geometry.vertices.length; ++i) {
                    mesh.geometry.vertices[i].z *= 90;
                }
                scene.add(mesh);
                var mesh = volumeLayers.getUpperBoundsMesh();
                for(var i=0; i<mesh.geometry.vertices.length; ++i) {
                    mesh.geometry.vertices[i].z *= 90;
                }
                scene.add(mesh);


                var cellLocations = volumeCells.getCellLocations(606);
                console.log(cellLocations);
                for (var i = 0; i < cellLocations.length; ++i) {
                    var geometry = new THREE.SphereGeometry(100);

                    // works correctly
                    //var z0 = volumeLayers.convertPoint(cellLocations[i].position, volumeLayers.ConversionModes.NORMALIZED_DEPTH, false, 15000);
                    //var z0 = volumeLayers.convertPoint(cellLocations[i].position, volumeLayers.ConversionModes.NORMALIZED_DEPTH, true);
                    //var z0 = volumeLayers.convertPoint(cellLocations[i].position, volumeLayers.ConversionModes.PERCENT_DIFFERENCE, false, 15000);
                    var z0 = volumeLayers.convertPoint(cellLocations[i].position, volumeLayers.ConversionModes.PERCENT_DIFFERENCE, true);

                    if (!z0) {
                        var material = new THREE.MeshBasicMaterial({
                            side: THREE.DoubleSide,
                            wireframe: true,
                            color: 0xcc0000
                        });
                    } else {
                        var material = new THREE.MeshBasicMaterial({
                            side: THREE.DoubleSide,
                            wireframe: true,
                            color: 0xcccc00
                        });
                    }
                    var mesh = new THREE.Mesh(geometry, material);
                    mesh.position.x = cellLocations[i].position.x;
                    mesh.position.y = cellLocations[i].position.y;
                    mesh.position.z = cellLocations[i].position.z * 90;
                    scene.add(mesh);
                }

                controls.getObject().translateX(cellLocations[0].position.x);
                controls.getObject().translateY(cellLocations[0].position.y);
                controls.getObject().translateZ(cellLocations[0].position.z);


                renderer = new THREE.WebGLRenderer();
                renderer.setClearColor(0xffffff);
                renderer.setPixelRatio(window.devicePixelRatio);
                renderer.setSize(window.innerWidth, window.innerHeight);
                el[0].appendChild(renderer.domElement);

                window.addEventListener('resize', onWindowResize, false);

            }

            function onWindowResize() {

                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();

                renderer.setSize(window.innerWidth, window.innerHeight);

            }

            function animate() {

                requestAnimationFrame(animate);

                var step = 30000;

                if (controlsEnabled) {

                    var time = performance.now();
                    var delta = ( time - prevTime ) / 1000;

                    velocity.x -= velocity.x * 10.0 * delta;
                    velocity.z -= velocity.z * 10.0 * delta;
                    velocity.y -= velocity.y * 10.0 * delta;

                    if (moveForward) velocity.z -= step * delta;
                    if (moveBackward) velocity.z += step * delta;

                    if (moveLeft) velocity.x -= step * delta;
                    if (moveRight) velocity.x += step * delta;

                    if (moveUp) velocity.y -= step * delta;
                    if (moveDown) velocity.y += step * delta;

                    controls.getObject().translateX(velocity.x * delta);
                    controls.getObject().translateY(velocity.y * delta);
                    controls.getObject().translateZ(velocity.z * delta);

                    prevTime = time;

                }

                renderer.render(scene, camera);

            }

        }


    }


})();