part of 'login_bloc.dart';

sealed class LoginEvent extends Equatable {
  const LoginEvent();

  @override
  List<Object> get props => [];
}

class NavigateRegisterScreenEvent extends LoginEvent {
  final BuildContext context;
  final Widget destination;

  const NavigateRegisterScreenEvent({
    required this.context,
    required this.destination,
  });
}

class NavigateHomeScreenEvent extends LoginEvent {
  final BuildContext context;
  final Widget destination;

  const NavigateHomeScreenEvent({
    required this.context,
    required this.destination,
  });
}

class LoginUserEvent extends LoginEvent {
  final BuildContext context;
  final Widget destination;
  final String email;
  final String password;

  const LoginUserEvent({
    required this.context,
    required this.email,
    required this.password,
    required this.destination,
  });
}

class TogglePasswordVisibilityEvent extends LoginEvent {}
